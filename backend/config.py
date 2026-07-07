"""Application configuration loaded from environment variables.

Uses ``python-dotenv`` to load a ``.env`` file when present, with
sensible defaults for every setting.
"""

import os
from dotenv import load_dotenv

load_dotenv()

__all__ = ["Config", "settings"]


class Config:
    """Global application configuration sourced from environment variables.

    Attributes:
        GEMINI_API_KEY: Google Gemini API key for AI features.
        GEMINI_MODEL: Default Gemini model identifier.
        SITES_DIR: Filesystem path where per-site data is persisted.
        HOST: Network interface to bind the HTTP server to.
        PORT: TCP port for the HTTP server.
        HEADLESS: Whether the browser should run in headless mode.
    """

    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
    SITES_DIR: str = os.getenv("SITES_DIR", "./sites")
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    HEADLESS: bool = os.getenv("HEADLESS", "true").lower() == "true"


settings = Config()
