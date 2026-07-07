"""DOM extraction via Crawl4AI.

Uses Crawl4AI's ``AsyncWebCrawler`` to produce clean, LLM-optimised
markdown and an interactive-element map for a given URL.
"""

import logging
from typing import Any

from crawl4ai import AsyncWebCrawler, CacheMode, CrawlerRunConfig
from crawl4ai.markdown_generation_strategy import DefaultMarkdownGenerator

__all__ = ["extract_page_content"]

logger = logging.getLogger(__name__)


async def extract_page_content(
    url: str,
    headless: bool = True,
    proxy: str | None = None,
) -> tuple[str, dict[str, Any]]:
    """Extract optimised markdown and an element map from a webpage.

    Crawl4AI is used under the hood; ``fit_html`` strips navigation and
    footer boilerplate, keeping the main content.

    Args:
        url: The page URL to extract from.
        headless: Whether the extraction browser runs headless.
        proxy: Optional proxy string (currently unused by Crawl4AI config
            but reserved for future use).

    Returns:
        A ``(clean_markdown, element_map)`` tuple.

    Raises:
        RuntimeError: If Crawl4AI fails to crawl the URL.
    """
    logger.info("[DOM_EXTRACTOR] Extracting content from %s ...", url)

    # JavaScript to extract interactive elements into `window.extracted_element_map`
    js_extract = '''
    const elements = Array.from(document.querySelectorAll('button, a, input, select, textarea, [role="button"]'));
    window.extracted_element_map = elements.map(el => ({
        tag: el.tagName.toLowerCase(),
        id: el.id,
        className: el.className,
        text: el.innerText?.trim().substring(0, 50),
        ariaLabel: el.getAttribute('aria-label'),
        name: el.getAttribute('name')
    }));
    '''
    config = CrawlerRunConfig(
        markdown_generator=DefaultMarkdownGenerator(content_source="fit_html"),
        cache_mode=CacheMode.BYPASS,
        js_code=js_extract,
    )

    async with AsyncWebCrawler(headless=headless) as crawler:
        result = await crawler.arun(url=url, config=config)

        if not result.success:
            logger.error("[DOM_EXTRACTOR] Crawl failed for %s: %s", url, result.error_message)
            raise RuntimeError(f"Failed to crawl {url}")

        clean_markdown: str = result.markdown.fit_markdown if result.markdown else ""

        # Element map is injected into `window`; placeholder until extraction
        # via result.html or a follow-up JS evaluation is implemented.
        element_map: dict[str, Any] = {}

        logger.info("[DOM_EXTRACTOR] Extracted %d chars of markdown from %s.", len(clean_markdown), url)
        return clean_markdown, element_map
