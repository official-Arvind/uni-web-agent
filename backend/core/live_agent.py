"""Live AI copilot session powered by Gemini and Playwright.

Launches a **visible** browser window so the user can watch the AI
navigate in real-time while receiving instructions over a WebSocket.
"""

import asyncio
import base64
import io
import json
import logging
import urllib.parse
from collections.abc import Callable
from typing import Any

from google import genai
from PIL import Image
from playwright.async_api import Browser, BrowserContext, Page, async_playwright
from playwright_stealth import Stealth
from pydantic import BaseModel

from backend.utils import file_manager
from backend.core.execution_engine import ExecutionEngine

__all__ = ["LiveAgentAction", "LiveAgentSession"]

logger = logging.getLogger(__name__)


class LiveAgentAction(BaseModel):
    """Single action decided by the AI for the live copilot.

    Attributes:
        action_type: One of ``click``, ``type``, ``goto``, ``scroll``,
            ``check_workflows``, ``run_workflow``, ``done``, ``error``.
        selector: CSS selector for the target element (click/type).
        value: URL, text value, or scroll amount.
        workflow_id: Required when ``action_type`` is ``run_workflow``.
        explanation: Human-readable reasoning for the action.
    """

    action_type: str
    selector: str | None = None
    value: str | None = None
    workflow_id: str | None = None
    explanation: str


class LiveAgentSession:
    """Interactive AI-driven browser session for live copiloting.

    Args:
        api_key: Google Gemini API key.
    """

    _MAX_STEPS: int = 10

    def __init__(self, api_key: str) -> None:
        self.api_key = api_key
        self.client = genai.Client(api_key=api_key)
        self.playwright = None
        self.browser: Browser | None = None
        self.context: BrowserContext | None = None
        self.page: Page | None = None
        self.is_running: bool = False

    async def start(self) -> None:
        """Initialise a visible browser session for live copiloting."""
        logger.info("[LIVE_AGENT] Starting visible browser session...")
        self.playwright = await async_playwright().start()
        logger.info("[LIVE_AGENT] Launching Chromium (headless=False)...")
        self.browser = await self.playwright.chromium.launch(
            headless=False,
            args=["--disable-blink-features=AutomationControlled"],
        )
        self.context = await self.browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            ),
        )
        self.page = await self.context.new_page()
        await Stealth().apply_stealth_async(self.page)
        logger.info("[LIVE_AGENT] Playwright page ready with stealth.")
        self.is_running = True

    async def stop(self) -> None:
        """Close the browser session and release all resources."""
        logger.info("[LIVE_AGENT] Stopping session...")
        self.is_running = False
        if self.context:
            await self.context.close()
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()

    async def get_state(self) -> dict[str, Any]:
        """Capture a screenshot and simplified DOM for the AI and frontend.

        Returns:
            A dict containing ``screenshot`` (base64), ``dom`` (JSON),
            ``url``, and ``raw_bytes``.
        """
        if not self.page:
            return {"screenshot": None, "dom": None, "url": None}

        # Take screenshot as base64
        screenshot_bytes: bytes = await self.page.screenshot(type="jpeg", quality=70)
        screenshot_b64: str = base64.b64encode(screenshot_bytes).decode("utf-8")

        # Extract simplified DOM
        element_map: list[dict] = await self.page.evaluate('''() => {
            const elements = Array.from(document.querySelectorAll('button, a, input, select, textarea, [role="button"]'));
            return elements.map((el, index) => {
                // Assign a temporary jigar-id for precise AI targeting
                const jigarId = el.getAttribute('jigar-id') || el.id || `jigar-el-${index}`;
                el.setAttribute('jigar-id', jigarId);
                
                return {
                    tag: el.tagName.toLowerCase(),
                    jigarId: jigarId,
                    className: el.className,
                    text: el.innerText?.trim().substring(0, 50),
                    ariaLabel: el.getAttribute('aria-label'),
                    type: el.getAttribute('type'),
                    name: el.getAttribute('name')
                };
            }).filter(el => el.text || el.ariaLabel || el.tag === 'input' || el.tag === 'select');
        }''')

        return {
            "screenshot": screenshot_b64,
            "dom": json.dumps(element_map, indent=2),
            "url": self.page.url,
            "raw_bytes": screenshot_bytes,
        }

    async def execute_instruction(self, instruction: str, ws_callback: Callable) -> None:
        """Process a natural-language instruction and execute it on the browser.

        Runs an agentic loop (up to ``_MAX_STEPS``) where each iteration:
        1. Captures the current page state.
        2. Asks Gemini for the next action.
        3. Executes the action via Playwright.

        Args:
            instruction: The user's natural-language request.
            ws_callback: Async callback to stream progress/screenshots.
        """
        if not self.page:
            await self.start()

        await ws_callback({"type": "log", "message": f"🤖 Received instruction: '{instruction}'"})

        for step in range(self._MAX_STEPS):
            await ws_callback({"type": "log", "message": "📸 Analysing current page state..."})
            state = await self.get_state()

            # Send live screenshot to frontend
            await ws_callback({
                "type": "screenshot",
                "data": state["screenshot"],
                "url": state["url"],
            })

            # Build AI prompt
            prompt = f"""
            You are Jigar Universal Web Agent, a live browser co-pilot.
            The user wants to accomplish this instruction: "{instruction}"
            
            Current URL: {state["url"]}
            
            Below is the simplified DOM containing interactive elements. Notice the 'jigarId' property.
            DOM:
            {state["dom"]}
            
            Based on the screenshot and DOM, determine the SINGLE NEXT LOGICAL STEP to progress towards the goal.
            - If you need to click, use action_type="click" and selector="[jigar-id='...']" or selector="#..."
            - If you need to type, use action_type="type", provide selector, and value.
            - If you need to navigate, use action_type="goto" and provide value (the URL).
            - If the instruction is complex, you can check available workflows on this domain using action_type="check_workflows".
            - If you found a matching workflow, execute it using action_type="run_workflow" and provide workflow_id.
            - If the instruction is complete, use action_type="done" and explain in explanation.
            - If impossible, use action_type="error".
            
            Provide a brief explanation of what you are doing so the user knows.
            """

            try:
                response = await self.client.aio.models.generate_content(
                    model="gemini-3.1-flash-lite",
                    contents=[
                        prompt,
                        Image.open(io.BytesIO(state["raw_bytes"])),
                    ],
                    config={
                        "response_mime_type": "application/json",
                        "response_schema": LiveAgentAction,
                        "temperature": 0.2,
                    },
                )
                action: LiveAgentAction = response.parsed

                await ws_callback({
                    "type": "log",
                    "message": f"🧠 AI Decision: {action.explanation} ({action.action_type})",
                })

                # Terminal states
                if action.action_type == "done":
                    await ws_callback({"type": "status", "message": "Instruction completed successfully!"})
                    break
                if action.action_type == "error":
                    await ws_callback({"type": "error", "message": action.explanation})
                    break

                # Non-terminal actions
                await self._dispatch_action(action, instruction, state, ws_callback)

                # Wait a moment for the page to settle
                await self.page.wait_for_timeout(1000)

            except (ConnectionError, TimeoutError) as exc:
                logger.error("[LIVE_AGENT] Network error during execution: %s", exc)
                await ws_callback({"type": "error", "message": f"Network error: {exc}"})
                break
            except Exception as exc:
                logger.error("[LIVE_AGENT] Unexpected execution error: %s", exc)
                await ws_callback({"type": "error", "message": f"Execution failed: {exc}"})
                break

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    async def _dispatch_action(
        self,
        action: LiveAgentAction,
        instruction: str,
        state: dict[str, Any],
        ws_callback: Callable,
    ) -> None:
        """Route a ``LiveAgentAction`` to the appropriate Playwright command.

        Args:
            action: The AI-decided action.
            instruction: The original user instruction (mutated for context).
            state: Current page state dict.
            ws_callback: Async callback for progress messages.
        """
        if action.action_type == "check_workflows":
            await self._handle_check_workflows(instruction, state, ws_callback)

        elif action.action_type == "run_workflow":
            await self._handle_run_workflow(action, state, ws_callback)

        elif action.action_type == "goto":
            await self.page.goto(action.value)

        elif action.action_type == "click":
            locator = self.page.locator(action.selector).first
            await locator.wait_for(state="visible", timeout=5000)
            # Highlight what we are clicking before clicking
            await locator.evaluate(
                "el => { el.style.border = '3px solid red'; el.style.backgroundColor = 'rgba(255,0,0,0.2)'; }"
            )
            highlight_state = await self.get_state()
            await ws_callback({"type": "screenshot", "data": highlight_state["screenshot"], "url": highlight_state["url"]})
            await asyncio.sleep(0.5)
            await locator.click()

        elif action.action_type == "type":
            locator = self.page.locator(action.selector).first
            await locator.wait_for(state="visible", timeout=5000)
            await locator.evaluate(
                "el => { el.style.border = '3px solid blue'; el.style.backgroundColor = 'rgba(0,0,255,0.2)'; }"
            )
            highlight_state = await self.get_state()
            await ws_callback({"type": "screenshot", "data": highlight_state["screenshot"], "url": highlight_state["url"]})
            await asyncio.sleep(0.5)
            await locator.fill(action.value)

        elif action.action_type == "scroll":
            await self.page.evaluate(f"window.scrollBy(0, {action.value or '500'})")

    async def _handle_check_workflows(
        self,
        instruction: str,
        state: dict[str, Any],
        ws_callback: Callable,
    ) -> None:
        """Check for existing workflows on the current domain.

        Args:
            instruction: The original instruction (context-enriched in-place).
            state: Current page state dict.
            ws_callback: Async callback for progress messages.
        """
        domain = urllib.parse.urlparse(state["url"]).netloc.replace("www.", "")
        wfs = file_manager.list_workflows(domain)
        if wfs:
            wf_list = ", ".join(f"{w.workflow_name} (ID: {w.workflow_id})" for w in wfs)
            await ws_callback({"type": "log", "message": f"🔍 Found workflows: {wf_list}"})
            instruction += f" [System: Available workflows for {domain} are: {wf_list}]"
        else:
            await ws_callback({"type": "log", "message": f"🔍 No workflows found for {domain}."})
            instruction += f" [System: No workflows found for {domain}, use manual visual browsing.]"

    async def _handle_run_workflow(
        self,
        action: LiveAgentAction,
        state: dict[str, Any],
        ws_callback: Callable,
    ) -> None:
        """Execute an existing workflow on the live page.

        Args:
            action: The AI action containing the ``workflow_id``.
            state: Current page state dict.
            ws_callback: Async callback for progress messages.
        """
        domain = urllib.parse.urlparse(state["url"]).netloc.replace("www.", "")
        wfs = file_manager.list_workflows(domain)
        wf = next((w for w in wfs if w.workflow_id == action.workflow_id), None)
        if not wf:
            await ws_callback({"type": "error", "message": "Invalid workflow_id."})
            return

        await ws_callback({"type": "log", "message": f"⚡ Running Zero-Token Workflow: {wf.workflow_name}..."})
        site_settings = file_manager.get_site_settings(domain)
        engine = ExecutionEngine(settings=site_settings, headless=False)

        async def _proxy_ws(msg: dict) -> None:
            await ws_callback({"type": "log", "message": f"  -> {msg.get('message', '')}"})

        try:
            await engine._execute_workflow_on_page(wf, self.page, _proxy_ws)
            await ws_callback({"type": "log", "message": "✅ Workflow completed!"})
        except Exception as exc:
            logger.error("[LIVE_AGENT] Workflow execution failed: %s", exc)
            await ws_callback({"type": "error", "message": f"Workflow failed: {exc}"})
