"""HTTP API routes for site and workflow management.

All routes are prefixed with ``/api/v1`` when mounted in the main app.
"""

import logging
import os

from fastapi import APIRouter, BackgroundTasks, HTTPException

from backend.api.websocket import manager
from backend.core.ai_mapper import auto_plan_workflows, generate_workflow_config
from backend.core.auto_healer import AutoHealer
from backend.core.execution_engine import ExecutionEngine, HealingRequired
from backend.models.api_models import (
    AutoSetupRequest,
    CreateSiteRequest,
    GenerateWorkflowRequest,
    GlobalSettings,
    RunWorkflowRequest,
    RunWorkflowResponse,
    SiteResponse,
    WorkflowResponse,
)
from backend.models.site_config import WorkflowConfig
from backend.utils import file_manager

__all__ = ["router"]

logger = logging.getLogger(__name__)

router = APIRouter()


# ---------------------------------------------------------------------------
# Settings
# ---------------------------------------------------------------------------

@router.get("/settings", response_model=GlobalSettings)
async def get_settings() -> GlobalSettings:
    """Return the persisted global settings.

    Returns:
        The current ``GlobalSettings`` object.
    """
    return file_manager.get_global_settings()


@router.post("/settings")
async def update_settings(settings: GlobalSettings) -> dict[str, str]:
    """Persist updated global settings.

    Args:
        settings: The new global settings payload.

    Returns:
        A status confirmation dict.
    """
    file_manager.save_global_settings(settings)
    return {"status": "success"}


# ---------------------------------------------------------------------------
# Sites
# ---------------------------------------------------------------------------

@router.get("/sites", response_model=list[SiteResponse])
async def list_sites() -> list[SiteResponse]:
    """List all registered sites with their workflow counts.

    Returns:
        A list of ``SiteResponse`` objects.
    """
    sites: list[SiteResponse] = []
    for domain in file_manager.list_sites():
        site_settings = file_manager.get_site_settings(domain)
        workflows = file_manager.list_workflows(domain)
        sites.append(
            SiteResponse(
                domain=domain,
                settings=site_settings,
                workflow_count=len(workflows),
            )
        )
    return sites


@router.post("/sites")
async def create_site(request: CreateSiteRequest) -> dict[str, str]:
    """Create a new site directory on disk.

    Args:
        request: Contains the target domain.

    Returns:
        A status confirmation dict.
    """
    domain = request.domain
    site_dir = os.path.join(file_manager.get_sites_dir(), domain)
    file_manager.ensure_dir(site_dir)
    return {"status": "success"}


# ---------------------------------------------------------------------------
# Workflows
# ---------------------------------------------------------------------------

@router.get("/sites/{domain}/workflows", response_model=list[WorkflowResponse])
async def get_workflows(domain: str) -> list[WorkflowResponse]:
    """Return all workflows for a given site domain.

    Args:
        domain: The site domain identifier.

    Returns:
        A list of ``WorkflowResponse`` summaries.
    """
    wfs = file_manager.list_workflows(domain)
    return [
        WorkflowResponse(
            workflow_id=wf.workflow_id,
            workflow_name=wf.workflow_name,
            workflow_description=wf.workflow_description,
            start_url=wf.start_url,
            steps_count=len(wf.steps),
            heal_count=wf.heal_count,
            last_successful_run=(
                str(wf.last_successful_run) if wf.last_successful_run else None
            ),
        )
        for wf in wfs
    ]


@router.post("/sites/{domain}/workflows")
async def generate_workflow(domain: str, req: GenerateWorkflowRequest) -> WorkflowConfig:
    """Generate a new workflow via AI and persist it.

    Args:
        domain: The target site domain.
        req: Workflow generation parameters.

    Returns:
        The newly created ``WorkflowConfig``.

    Raises:
        HTTPException: If the Gemini API key is not configured (400).
    """
    global_settings = file_manager.get_global_settings()
    if not global_settings.gemini_api_key:
        raise HTTPException(status_code=400, detail="Gemini API Key not configured")

    config = await generate_workflow_config(
        url=req.start_url,
        workflow_name=req.workflow_name,
        workflow_description=req.workflow_description,
        api_key=global_settings.gemini_api_key,
        proxy=global_settings.default_proxy,
    )

    file_manager.save_workflow(domain, config)
    return config


# ---------------------------------------------------------------------------
# Auto-setup
# ---------------------------------------------------------------------------

async def _background_auto_setup(
    domain: str,
    capabilities: str,
    api_key: str,
    proxy: str | None,
) -> None:
    """Background task that plans and generates workflows for a domain.

    Args:
        domain: Target site domain.
        capabilities: User-specified capability hints.
        api_key: Gemini API key.
        proxy: Optional proxy string.
    """
    await manager.send_progress(domain, {"type": "log", "message": "🧠 Planning workflows..."})
    try:
        ideas = await auto_plan_workflows(domain, capabilities, api_key)
        await manager.send_progress(
            domain,
            {"type": "log", "message": f"📋 Planned {len(ideas)} workflows. Generating configurations..."},
        )

        for i, idea in enumerate(ideas):
            await manager.send_progress(
                domain,
                {"type": "log", "message": f"⚙️ Generating ({i + 1}/{len(ideas)}): {idea.workflow_name}"},
            )
            try:
                config = await generate_workflow_config(
                    url=idea.start_url,
                    workflow_name=idea.workflow_name,
                    workflow_description=idea.workflow_description,
                    api_key=api_key,
                    proxy=proxy,
                )
                file_manager.save_workflow(domain, config)
                await manager.send_progress(
                    domain,
                    {"type": "log", "message": f"✅ Saved workflow: {idea.workflow_name}"},
                )
            except (ConnectionError, TimeoutError, ValueError, RuntimeError) as exc:
                logger.warning("[ROUTES] Workflow generation failed for %s: %s", idea.workflow_name, exc)
                await manager.send_progress(
                    domain,
                    {"type": "error", "message": f"❌ Failed to generate {idea.workflow_name}: {exc}"},
                )

        await manager.send_progress(
            domain,
            {"type": "status", "message": "Auto-setup completed! Please refresh."},
        )
    except Exception as exc:
        logger.error("[ROUTES] Auto-setup failed for domain=%s: %s", domain, exc)
        await manager.send_progress(domain, {"type": "error", "message": f"Auto-setup failed: {exc}"})


@router.post("/sites/{domain}/auto-setup")
async def auto_setup_site(domain: str, req: AutoSetupRequest, background_tasks: BackgroundTasks) -> dict[str, str]:
    """Trigger AI-driven workflow auto-setup for a site.

    Args:
        domain: The target site domain.
        req: Contains user capability hints.
        background_tasks: FastAPI background tasks dependency.

    Returns:
        A status confirmation dict.

    Raises:
        HTTPException: If the Gemini API key is not configured (400).
    """
    global_settings = file_manager.get_global_settings()
    if not global_settings.gemini_api_key:
        raise HTTPException(status_code=400, detail="Gemini API Key not configured")

    background_tasks.add_task(
        _background_auto_setup,
        domain=domain,
        capabilities=req.capabilities,
        api_key=global_settings.gemini_api_key,
        proxy=global_settings.default_proxy,
    )
    return {"status": "success", "message": "Auto-setup started"}


# ---------------------------------------------------------------------------
# Workflow Execution
# ---------------------------------------------------------------------------

async def _run_workflow_background(domain: str, workflow_id: str, headless: bool) -> None:
    """Background task that executes a workflow and streams progress via WebSocket.

    Args:
        domain: The site domain owning the workflow.
        workflow_id: Unique workflow identifier.
        headless: Whether to launch the browser in headless mode.
    """
    workflows = file_manager.list_workflows(domain)
    workflow = next((w for w in workflows if w.workflow_id == workflow_id), None)
    if not workflow:
        logger.warning("[ROUTES] Workflow %s not found for domain=%s", workflow_id, domain)
        return

    site_settings = file_manager.get_site_settings(domain)
    engine = ExecutionEngine(settings=site_settings, headless=headless)

    async def ws_callback(message: dict) -> None:
        await manager.send_progress(domain, message)

    try:
        await engine.execute_workflow(workflow, ws_callback)
        await manager.send_progress(domain, {"type": "complete"})
    except HealingRequired as hr:
        await manager.send_progress(domain, {"type": "healing", "step": hr.step.step_number})

        global_settings = file_manager.get_global_settings()
        healer = AutoHealer(api_key=global_settings.gemini_api_key)

        healed = await healer.heal_step(hr.page, hr.step, workflow, domain)
        if healed:
            file_manager.save_workflow(domain, workflow)
            await manager.send_progress(domain, {"type": "healing_success"})
        else:
            await manager.send_progress(domain, {"type": "healing_failed"})
    except Exception as exc:
        logger.error("[ROUTES] Workflow execution error: %s", exc)
        await manager.send_progress(domain, {"type": "error", "message": str(exc)})


@router.post("/sites/{domain}/workflows/{workflow_id}/run", response_model=RunWorkflowResponse)
async def run_workflow(
    domain: str,
    workflow_id: str,
    req: RunWorkflowRequest,
    background_tasks: BackgroundTasks,
) -> RunWorkflowResponse:
    """Kick off a workflow execution in the background.

    Args:
        domain: The site domain.
        workflow_id: The workflow to run.
        req: Execution options (headless, etc.).
        background_tasks: FastAPI background task manager.

    Returns:
        A ``RunWorkflowResponse`` with the WebSocket logs URL.
    """
    background_tasks.add_task(_run_workflow_background, domain, workflow_id, req.headless)
    return RunWorkflowResponse(
        status="success",
        message="Workflow started",
        logs_url=f"/ws/execution/{domain}",
    )
