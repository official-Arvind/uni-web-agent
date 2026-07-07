"""Self-healing selector logic using Gemini vision.

When a workflow step's CSS selector breaks due to a site redesign,
this module takes a screenshot + simplified DOM, sends them to Gemini,
and patches the selector in-place.
"""

import io
import json
import logging

from google import genai
from PIL import Image
from playwright.async_api import Page
from pydantic import BaseModel

from backend.models.site_config import ElementSelector, WorkflowConfig, WorkflowStep
from backend.utils import file_manager

__all__ = ["HealedSelectorResponse", "AutoHealer"]

logger = logging.getLogger(__name__)


class HealedSelectorResponse(BaseModel):
    """Gemini-structured response for a healed selector.

    Attributes:
        healed: Whether the healing was successful.
        new_selector: The replacement ``ElementSelector``, if healed.
        reasoning: AI explanation of the healing decision.
    """

    healed: bool
    new_selector: ElementSelector | None = None
    reasoning: str


class AutoHealer:
    """Attempts to automatically repair broken element selectors using AI vision.

    Args:
        api_key: Google Gemini API key.
    """

    def __init__(self, api_key: str) -> None:
        self.api_key = api_key
        self.client = genai.Client(api_key=api_key)

    async def heal_step(
        self,
        page: Page,
        step: WorkflowStep,
        config: WorkflowConfig,
        domain: str = "",
    ) -> bool:
        """Attempt to heal the selector for a broken workflow step.

        Takes a screenshot, extracts the simplified DOM, and asks Gemini
        to produce a new resilient selector.

        Args:
            page: The live Playwright page where the step failed.
            step: The ``WorkflowStep`` whose selector is broken.
            config: The parent ``WorkflowConfig`` (mutated on success).
            domain: Site domain string used for persisting the healed config.

        Returns:
            ``True`` if the selector was successfully healed, ``False`` otherwise.
        """
        logger.info("[AUTO_HEALER] Initiating heal for step %d of '%s'.", step.step_number, config.workflow_name)

        # 1. Take a screenshot for context
        screenshot_bytes: bytes = await page.screenshot()

        # 2. Extract DOM elements tree using page evaluation
        element_map: list[dict] = await page.evaluate('''() => {
            const elements = Array.from(document.querySelectorAll('button, a, input, select, textarea, [role="button"]'));
            return elements.map(el => ({
                tag: el.tagName.toLowerCase(),
                id: el.id,
                className: el.className,
                text: el.innerText?.trim().substring(0, 50),
                ariaLabel: el.getAttribute('aria-label'),
                name: el.getAttribute('name')
            }));
        }''')
        simplified_dom: str = json.dumps(element_map, indent=2)

        # 3. Call Gemini to heal
        prompt = f"""
        You are a self-healing web automation expert.
        The automation workflow '{config.workflow_name}' failed at step {step.step_number}: '{step.description}'.
        
        The previous target element was:
        Name: {step.target.element_name}
        Primary Selector: {step.target.primary}
        Fingerprint: {step.target.fingerprint.model_dump_json()}
        
        This selector no longer works on the current page.
        Analyze the provided DOM (and screenshot if available) to find the new selector for this element.
        Return the new resilient selector and updated fingerprint.
        """

        settings = file_manager.get_global_settings()
        model_name = settings.gemini_model or "gemini-1.5-flash"

        try:
            logger.info("[AUTO_HEALER] Calling Gemini for healing...")
            response = await self.client.aio.models.generate_content(
                model=model_name,
                contents=[
                    prompt,
                    Image.open(io.BytesIO(screenshot_bytes)),
                    {"text": f"DOM Elements Map:\n{simplified_dom}"},
                ],
                config={
                    "response_mime_type": "application/json",
                    "response_schema": HealedSelectorResponse,
                },
            )

            result: HealedSelectorResponse = response.parsed
            if result.healed and result.new_selector:
                logger.info(
                    "[AUTO_HEALER] Successfully healed selector — new primary: %s",
                    result.new_selector.primary,
                )
                # Update the step with the new target
                step.target = result.new_selector

                # Increment config version and heal count
                config.version += 1
                config.heal_count += 1

                # Persist config changes
                await self._save_config(config, domain)
                return True

            logger.error("[AUTO_HEALER] AI could not heal selector: %s", result.reasoning)
            return False

        except (ConnectionError, TimeoutError) as exc:
            logger.error("[AUTO_HEALER] Network error during healing: %s", exc)
            return False
        except Exception as exc:
            logger.error("[AUTO_HEALER] Unexpected error during healing: %s", exc)
            return False

    async def _save_config(self, config: WorkflowConfig, domain: str) -> None:
        """Persist the healed workflow config to disk.

        Args:
            config: The updated workflow config.
            domain: Site domain identifier.
        """
        if domain:
            file_manager.save_workflow(domain, config)
