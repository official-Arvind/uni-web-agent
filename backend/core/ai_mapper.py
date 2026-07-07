"""AI-driven workflow generation and planning via Gemini.

Extracts page content using Crawl4AI, sends it to Gemini 3.5 Flash,
and returns structured ``WorkflowConfig`` objects.
"""

import asyncio
import logging
import uuid

from google import genai
from pydantic import BaseModel

from backend.core.dom_extractor import extract_page_content
from backend.models.ai_schemas import GeneratedWorkflow
from backend.models.site_config import WorkflowConfig

__all__ = [
    "WorkflowIdea",
    "AutoPlanResponse",
    "generate_workflow_config",
    "auto_plan_workflows",
]

logger = logging.getLogger(__name__)

_MAX_RETRIES: int = 3
_RETRY_DELAY_SECONDS: float = 10.0


class WorkflowIdea(BaseModel):
    """A single workflow idea produced by AI planning.

    Attributes:
        workflow_name: Human-readable name for the workflow.
        workflow_description: Detailed description of what the workflow does.
        start_url: The URL where the workflow begins.
    """

    workflow_name: str
    workflow_description: str
    start_url: str


class AutoPlanResponse(BaseModel):
    """Container for a list of AI-planned workflow ideas.

    Attributes:
        workflows: Ordered list of ``WorkflowIdea`` objects.
    """

    workflows: list[WorkflowIdea]


async def generate_workflow_config(
    url: str,
    workflow_name: str,
    workflow_description: str,
    api_key: str,
    headless: bool = True,
    proxy: str | None = None,
) -> WorkflowConfig:
    """Generate a complete ``WorkflowConfig`` by analysing a live webpage.

    Steps:
        1. Extracts DOM using Crawl4AI (markdown + element map).
        2. Sends to Gemini 3.5 Flash for mapping.
        3. Returns a structured ``WorkflowConfig``.

    Args:
        url: Target page URL to analyse.
        workflow_name: Desired human-readable workflow name.
        workflow_description: What the workflow should accomplish.
        api_key: Google Gemini API key.
        headless: Whether the extraction browser runs headless.
        proxy: Optional proxy string for the extraction browser.

    Returns:
        A fully populated ``WorkflowConfig``.

    Raises:
        RuntimeError: If all Gemini API retries are exhausted.
    """
    # 1. Extract content
    markdown_content, element_map = await extract_page_content(url, headless, proxy)

    # 2. Call Gemini
    client = genai.Client(api_key=api_key)

    prompt = f"""
    You are a web automation expert. Analyze this webpage and create a
    step-by-step automation workflow.

    **Target URL:** {url}
    **Desired Workflow Name:** {workflow_name}
    **Desired Workflow Description:** {workflow_description}

    **Page Content (Markdown):**
    {markdown_content}

    **Interactive Elements Map:**
    {element_map}

    Generate a complete workflow config with resilient CSS selectors,
    XPath fallbacks, and element fingerprints for self-healing.
    """

    logger.info("[AI_MAPPER] Calling Gemini for workflow generation on url=%s", url)

    generated: GeneratedWorkflow | None = None
    for attempt in range(_MAX_RETRIES):
        try:
            response = await client.aio.models.generate_content(
                model="gemini-3.1-pro",
                contents=prompt,
                config={
                    "response_mime_type": "application/json",
                    "response_schema": GeneratedWorkflow,
                    "temperature": 0.2,
                },
            )
            generated = response.parsed
            break
        except Exception as exc:
            logger.warning(
                "[AI_MAPPER] Gemini API attempt %d/%d failed: %s",
                attempt + 1,
                _MAX_RETRIES,
                exc,
            )
            if attempt == _MAX_RETRIES - 1:
                raise
            await asyncio.sleep(_RETRY_DELAY_SECONDS)

    # 3. Assemble and return full config
    config = WorkflowConfig(
        workflow_id=str(uuid.uuid4()),
        workflow_name=workflow_name,
        workflow_description=workflow_description,
        start_url=url,
        steps=generated.steps,
    )

    logger.info("[AI_MAPPER] Successfully generated workflow '%s' with %d steps.", workflow_name, len(config.steps))
    return config


async def auto_plan_workflows(
    domain: str,
    capabilities: str,
    api_key: str,
    existing_workflows: list[WorkflowConfig] | None = None,
) -> list[WorkflowIdea]:
    """Use AI to plan a set of workflows for a given domain.

    Args:
        domain: The website domain to plan workflows for.
        capabilities: User-specified capability hints (may be empty).
        api_key: Google Gemini API key.

    Returns:
        A list of ``WorkflowIdea`` suggestions.

    Raises:
        RuntimeError: If all Gemini API retries are exhausted.
    """
    client = genai.Client(api_key=api_key)

    if capabilities and capabilities.strip():
        capabilities_prompt = (
            f'The user wants the agent to have these specific capabilities:\n    "{capabilities}"'
        )
    else:
        capabilities_prompt = (
            f"Analyze the domain and automatically deduce all the logical workflows "
            f"a user might want to do on {domain} (e.g. login, search, add to cart, check orders, etc)."
        )

    existing_prompt = ""
    if existing_workflows:
        existing_names = [wf.workflow_name for wf in existing_workflows]
        existing_prompt = (
            f"\nWARNING: The following workflows ALREADY EXIST for this domain: {existing_names}.\n"
            f"DO NOT generate any workflows that overlap with these existing ones. Only generate NEW workflows."
        )

    prompt = f"""
    You are an AI architect planning out web automation workflows for the domain: {domain}
    {capabilities_prompt}
    {existing_prompt}
    
    Break this down into distinct, logical workflows. For each workflow, provide:
    1. A clear workflow_name (e.g. "Add to Cart")
    2. A detailed workflow_description of what steps the agent should take.
    3. The most likely start_url for this workflow on {domain} (e.g. "https://{domain}/search" or "https://{domain}/").
    
    Return a list of these workflows. Provide at least 3-5 useful workflows if analyzing automatically.
    """

    logger.info("[AI_MAPPER] Planning workflows for domain=%s", domain)

    for attempt in range(_MAX_RETRIES):
        try:
            response = await client.aio.models.generate_content(
                model="gemini-3.1-pro",
                contents=prompt,
                config={
                    "response_mime_type": "application/json",
                    "response_schema": AutoPlanResponse,
                    "temperature": 0.2,
                },
            )
            workflows = response.parsed.workflows
            if not workflows:
                raise ValueError("AI returned 0 workflows, retrying...")
            logger.info("[AI_MAPPER] Planned %d workflows for domain=%s.", len(workflows), domain)
            return workflows
        except Exception as exc:
            logger.warning(
                "[AI_MAPPER] Gemini planning attempt %d/%d failed: %s",
                attempt + 1,
                _MAX_RETRIES,
                exc,
            )
            if attempt == _MAX_RETRIES - 1:
                raise
            await asyncio.sleep(_RETRY_DELAY_SECONDS)

    return []
