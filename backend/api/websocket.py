"""WebSocket endpoints for real-time execution progress and live agent sessions."""

import asyncio
import logging
import traceback

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from backend.core.live_agent import LiveAgentSession
from backend.utils.file_manager import get_global_settings

__all__ = ["ws_router", "manager", "ConnectionManager"]

logger = logging.getLogger(__name__)

ws_router = APIRouter()


class ConnectionManager:
    """Manages per-domain WebSocket connections for streaming execution progress.

    Each domain can have at most one active WebSocket connection at a time.
    """

    def __init__(self) -> None:
        self.active_connections: dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, domain: str) -> None:
        """Accept and register a WebSocket connection for a domain.

        Args:
            websocket: The incoming WebSocket instance.
            domain: The site domain this connection belongs to.
        """
        await websocket.accept()
        self.active_connections[domain] = websocket
        logger.info("[WS] Client connected for domain=%s", domain)

    def disconnect(self, domain: str) -> None:
        """Remove a domain's WebSocket connection.

        Args:
            domain: The domain whose connection should be dropped.
        """
        if domain in self.active_connections:
            del self.active_connections[domain]
            logger.info("[WS] Client disconnected for domain=%s", domain)

    async def send_progress(self, domain: str, message: dict) -> None:
        """Send a JSON progress message to the domain's WebSocket client.

        Args:
            domain: Target domain.
            message: JSON-serializable message dict.
        """
        if domain in self.active_connections:
            await self.active_connections[domain].send_json(message)


manager = ConnectionManager()


@ws_router.websocket("/ws/execution/{domain}")
async def websocket_endpoint(websocket: WebSocket, domain: str) -> None:
    """WebSocket endpoint for streaming workflow execution progress.

    Args:
        websocket: The WebSocket connection.
        domain: The site domain to stream progress for.
    """
    await manager.connect(websocket, domain)
    try:
        while True:
            # Keep connection alive; we don't expect client messages here.
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(domain)


@ws_router.websocket("/ws/live-agent")
async def live_agent_endpoint(websocket: WebSocket) -> None:
    """WebSocket endpoint for interactive live-agent copilot sessions.

    The client sends JSON messages with an ``instruction`` key; each
    instruction is executed sequentially against the live browser session.

    Args:
        websocket: The WebSocket connection.
    """
    await websocket.accept()
    settings = get_global_settings()
    if not settings.gemini_api_key:
        await websocket.send_json({"type": "error", "message": "Gemini API key is required."})
        await websocket.close()
        return

    session = LiveAgentSession(api_key=settings.gemini_api_key)

    async def ws_callback(message: dict) -> bool:
        try:
            await websocket.send_json(message)
            return True
        except (ConnectionError, RuntimeError):
            logger.warning("[WS] Failed to send message to live-agent client.")
            return False

    async def continuous_stream():
        while True:
            try:
                if session.is_running:
                    if not session.page or session.page.is_closed():
                        raise RuntimeError("Page is closed")
                    state = await session.get_state()
                    if state.get("screenshot"):
                        success = await ws_callback({
                            "type": "screenshot",
                            "data": state["screenshot"],
                            "url": state["url"],
                        })
                        if not success:
                            break
                await asyncio.sleep(0.2)
            except RuntimeError as e:
                if "Browser disconnected" in str(e) or "Page is closed" in str(e):
                    if session.is_running:
                        logger.warning("[WS] Browser connection dropped. Auto-restarting...")
                        await session.stop()
                        try:
                            await session.start()
                        except Exception as start_e:
                            logger.error(f"[WS] Failed to restart browser: {start_e}")
                            session.is_running = True
                            await asyncio.sleep(2)
                await asyncio.sleep(1)
            except Exception:
                await asyncio.sleep(1)

    stream_task = asyncio.create_task(continuous_stream())

    try:
        while True:
            data: dict = await websocket.receive_json()
            if "instruction" in data:
                await session.execute_instruction(data["instruction"], ws_callback)
            elif "remote_action" in data:
                await session.handle_remote_action(data, ws_callback)
            elif data.get("action") == "start_auth":
                if not session.page:
                    await session.start()
                await session.page.goto("https://accounts.google.com/")
                state = await session.get_state()
                if state["screenshot"]:
                    await ws_callback({
                        "type": "screenshot",
                        "data": state["screenshot"],
                        "url": state["url"],
                    })
    except WebSocketDisconnect:
        logger.info("[WS] Live-agent client disconnected.")
    except Exception as exc:
        logger.error("[WS] Unexpected error in live-agent session: %s", exc)
        traceback.print_exc()
    finally:
        if stream_task:
            stream_task.cancel()
        await session.stop()
