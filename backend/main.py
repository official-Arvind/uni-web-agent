"""FastAPI application entry-point for Jigar Universal Web Agent.

Configures the ASGI app, CORS middleware, and routes.  On Windows the
``ProactorEventLoop`` is enforced so Playwright operates correctly.
"""

import asyncio
import logging
import sys
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.routes import router
from backend.api.websocket import ws_router

__all__ = ["app"]

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Windows ProactorEventLoop enforcement
# ---------------------------------------------------------------------------
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    try:
        import uvicorn.loops.asyncio

        def _patched_loop_factory(use_subprocess: bool = False) -> type[asyncio.ProactorEventLoop]:
            """Return the ProactorEventLoop class for Uvicorn on Windows."""
            return asyncio.ProactorEventLoop

        uvicorn.loops.asyncio.asyncio_loop_factory = _patched_loop_factory
    except ImportError:
        pass


# ---------------------------------------------------------------------------
# Lifespan (replaces deprecated @app.on_event)
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Application lifespan manager.

    Validates that a ``ProactorEventLoop`` is active on Windows so that
    Playwright can function properly.

    Yields:
        Control to the running application.
    """
    loop = asyncio.get_running_loop()
    if sys.platform == "win32" and isinstance(loop, asyncio.SelectorEventLoop):
        logger.error(
            "\n" + "=" * 80 + "\n"
            "CRITICAL ERROR: Playwright requires a ProactorEventLoop on Windows, but Uvicorn "
            "is running with a SelectorEventLoop.\n"
            "This happens when using the '--reload' or '--workers' flags in Uvicorn on Windows.\n"
            "To fix this, STOP the server and restart it WITHOUT the '--reload' flag:\n"
            "    python -m uvicorn backend.main:app --port 8000\n"
            + "=" * 80 + "\n"
        )
    logger.info("[MAIN] Application startup complete.")
    yield
    logger.info("[MAIN] Application shutdown complete.")


# ---------------------------------------------------------------------------
# FastAPI Application
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Jigar Universal Web Agent",
    version="1.0.0",
    description="Hybrid Declarative Web Agent by Jigar Corporation",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://official-arvind.github.io"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api/v1")
app.include_router(ws_router)


@app.get("/")
async def root() -> dict[str, str]:
    """Health-check root endpoint.

    Returns:
        A simple status message confirming the API is running.
    """
    return {"message": "Jigar Universal Web Agent API is running"}
