"""Browser lifecycle management for Camoufox and standard Playwright.

Provides a unified interface for obtaining browser contexts with
optional proxy support.
"""

import logging

from camoufox.async_api import AsyncCamoufox
from playwright.async_api import Browser, BrowserContext, async_playwright

from backend.models.site_config import ProxyConfig

__all__ = ["BrowserManager"]

logger = logging.getLogger(__name__)


class BrowserManager:
    """Manages the lifecycle of browser instances and contexts.

    Supports both **Camoufox** (anti-fingerprint) and standard Playwright
    Chromium backends, with optional proxy configuration.

    Args:
        headless: Whether to launch the browser in headless mode.
    """

    def __init__(self, headless: bool = True) -> None:
        self.headless = headless
        self.browser: Browser | None = None
        self._playwright = None

    async def init_camoufox(self, proxy_config: ProxyConfig | None = None) -> AsyncCamoufox:
        """Initialise a Camoufox browser instance with optional proxy.

        Args:
            proxy_config: Optional proxy configuration.

        Returns:
            An ``AsyncCamoufox`` browser instance.
        """
        proxy_str: str | None = None
        if proxy_config:
            if proxy_config.username and proxy_config.password:
                auth = f"{proxy_config.username}:{proxy_config.password}@"
                proxy_str = f"http://{auth}{proxy_config.server}"
            else:
                proxy_str = f"http://{proxy_config.server}"

        logger.info("[BROWSER] Initialising Camoufox (headless=%s)...", self.headless)
        return await AsyncCamoufox(headless=self.headless, proxy=proxy_str)

    async def get_context(
        self,
        use_camoufox: bool = True,
        proxy_config: ProxyConfig | None = None,
    ) -> tuple[Browser | AsyncCamoufox, BrowserContext]:
        """Return a managed browser context.

        The caller is responsible for closing the returned context (and
        browser, when using standard Playwright).

        Args:
            use_camoufox: Use Camoufox when ``True``, otherwise standard Chromium.
            proxy_config: Optional proxy configuration.

        Returns:
            A ``(browser, context)`` tuple.
        """
        if use_camoufox:
            browser = await self.init_camoufox(proxy_config)
            context = await browser.new_context()
            return browser, context

        if not self._playwright:
            self._playwright = await async_playwright().start()

        # Use Chromium by default for standard
        browser_args: dict = {}
        if proxy_config:
            proxy_settings: dict[str, str] = {"server": proxy_config.server}
            if proxy_config.username and proxy_config.password:
                proxy_settings["username"] = proxy_config.username
                proxy_settings["password"] = proxy_config.password
            browser_args["proxy"] = proxy_settings

        self.browser = await self._playwright.chromium.launch(
            headless=self.headless,
            **browser_args,
        )
        context = await self.browser.new_context()
        logger.info("[BROWSER] Standard Chromium context created.")
        return self.browser, context
