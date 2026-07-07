"""Zero-token deterministic workflow executor.

Plays back a ``WorkflowConfig`` step-by-step using Playwright,
with fallback selector chains and a ``HealingRequired`` escape-hatch
for the auto-healer.
"""

import logging
import os
from collections.abc import Callable

from playwright.async_api import Page, TimeoutError as PlaywrightTimeout
from playwright_stealth import Stealth

from backend.core.browser_manager import BrowserManager
from backend.models.site_config import SiteSettings, WorkflowConfig, WorkflowStep
from backend.utils import file_manager

__all__ = ["HealingRequired", "ExecutionEngine"]

logger = logging.getLogger(__name__)


class HealingRequired(Exception):
    """Raised when every selector (primary + fallbacks) fails for a step.

    Attributes:
        step: The ``WorkflowStep`` that could not locate its target.
        page: The live Playwright ``Page`` for the healer to inspect.
    """

    def __init__(self, step: WorkflowStep, page: Page) -> None:
        self.step = step
        self.page = page
        super().__init__(f"Healing required for step {step.step_number}")


class ExecutionEngine:
    """Deterministic workflow executor backed by Playwright.

    Args:
        settings: Per-site settings (proxy, camoufox toggle, domain).
        headless: Whether to run the browser headless.
    """

    def __init__(self, settings: SiteSettings, headless: bool = True) -> None:
        self.settings = settings
        self.browser_manager = BrowserManager(headless=headless)

    async def execute_workflow(
        self,
        config: WorkflowConfig,
        ws_callback: Callable | None = None,
    ) -> None:
        """Execute a full workflow in a fresh browser context.

        If a selector fails after exhausting all fallbacks,
        ``HealingRequired`` is raised for the caller to handle.

        Args:
            config: The workflow to execute.
            ws_callback: Optional async callback for progress messages.

        Raises:
            HealingRequired: When a step's element cannot be located.
        """
        logger.info("[ENGINE] Starting workflow: %s", config.workflow_name)
        browser, context = await self.browser_manager.get_context(
            use_camoufox=self.settings.use_camoufox,
            proxy_config=self.settings.proxy,
        )
        page = await context.new_page()
        await Stealth().apply_stealth_async(page)

        try:
            for step in config.steps:
                if ws_callback:
                    await ws_callback({"type": "progress", "step": step.step_number, "message": step.description})

                await self._execute_step(page, step)

                if step.screenshot_after:
                    screenshots_dir = os.path.join(
                        file_manager.get_sites_dir(),
                        self.settings.domain,
                        "screenshots",
                    )
                    file_manager.ensure_dir(screenshots_dir)
                    screenshot_path = os.path.join(screenshots_dir, f"step_{step.step_number}.png")
                    await page.screenshot(path=screenshot_path)

                if step.wait_after_ms > 0:
                    await page.wait_for_timeout(step.wait_after_ms)

        except HealingRequired:
            logger.warning("[ENGINE] Healing required — propagating to caller.")
            raise
        except Exception as exc:
            logger.error("[ENGINE] Workflow '%s' failed: %s", config.workflow_name, exc)
            raise
        finally:
            await context.close()
            if not getattr(browser, "is_camoufox", False):
                await browser.close()

        logger.info("[ENGINE] Workflow '%s' completed successfully.", config.workflow_name)

    async def _execute_workflow_on_page(
        self,
        config: WorkflowConfig,
        page: Page,
        ws_callback: Callable | None = None,
    ) -> None:
        """Execute a workflow on an existing Playwright page (no new browser).

        Used by the live-agent to re-use its already-visible browser tab.

        Args:
            config: The workflow to execute.
            page: An existing Playwright ``Page``.
            ws_callback: Optional async callback for progress messages.
        """
        logger.info("[ENGINE] Executing workflow on existing page: %s", config.workflow_name)
        for step in config.steps:
            if ws_callback:
                await ws_callback({"type": "progress", "step": step.step_number, "message": step.description})

            await self._execute_step(page, step)

            if step.screenshot_after:
                screenshots_dir = os.path.join(
                    file_manager.get_sites_dir(),
                    self.settings.domain,
                    "screenshots",
                )
                file_manager.ensure_dir(screenshots_dir)
                screenshot_path = os.path.join(screenshots_dir, f"step_{step.step_number}.png")
                await page.screenshot(path=screenshot_path)

            if step.wait_after_ms > 0:
                await page.wait_for_timeout(step.wait_after_ms)

    async def _execute_step(self, page: Page, step: WorkflowStep) -> None:
        """Execute a single workflow step.

        Args:
            page: The Playwright page.
            step: The step to execute.

        Raises:
            HealingRequired: If the target element cannot be found.
            ValueError: If a required target is missing.
        """
        logger.info("[ENGINE] Step %d — action=%s", step.step_number, step.action)

        if step.action == "navigate":
            await page.goto(step.value if step.value else step.target.primary)
            return

        if step.action == "wait":
            if step.value:
                try:
                    await page.wait_for_timeout(int(step.value))
                except ValueError:
                    # Value is a selector string, not a number
                    await page.wait_for_selector(step.value)
            return

        # For actions that require a target element
        if not step.target:
            raise ValueError(f"Target is required for action '{step.action}'")

        # Locate element with fallback logic
        locator = page.locator(step.target.primary)

        # Check if primary exists
        try:
            await locator.wait_for(state="visible", timeout=3000)
        except PlaywrightTimeout:
            # Primary failed, try fallbacks
            found = False
            for fallback in step.target.fallbacks:
                locator = page.locator(fallback)
                try:
                    await locator.wait_for(state="visible", timeout=2000)
                    found = True
                    break
                except PlaywrightTimeout:
                    continue

            if not found:
                raise HealingRequired(step, page)

        # Execute action on the located element
        if step.action == "click":
            await locator.click()
        elif step.action == "type":
            await locator.fill(step.value)
        elif step.action == "select":
            await locator.select_option(step.value)
        elif step.action == "scroll":
            await page.evaluate(f"window.scrollBy(0, {step.value or '500'})")
        elif step.action == "extract":
            text = await locator.text_content()
            logger.info("[ENGINE] Extracted text: %s", text)
