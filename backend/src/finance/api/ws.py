import asyncio
import json
import logging

import redis.asyncio as aioredis
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from finance.core.config import settings
from finance.services import stream
from finance.services.stream import PUBSUB_CHANNEL

logger = logging.getLogger("finance.ws")

router = APIRouter()

WS_SEND_INTERVAL = 0.3

class BroadcastManager:

    def __init__(self, channel: str, label: str = "WS") -> None:
        self._clients: set[WebSocket] = set()
        self._lock = asyncio.Lock()
        self._pubsub_task: asyncio.Task | None = None
        self._pending: dict[WebSocket, dict[str, str]] = {}
        self._flush_task: asyncio.Task | None = None
        self._channel = channel
        self._label = label

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()
        async with self._lock:
            self._clients.add(ws)
            self._pending[ws] = {}
            logger.info("%s client connected (%d total)", self._label, len(self._clients))
        self._ensure_pubsub()
        self._ensure_flush()

    async def disconnect(self, ws: WebSocket) -> None:
        async with self._lock:
            self._clients.discard(ws)
            self._pending.pop(ws, None)
            logger.info("%s client disconnected (%d remaining)", self._label, len(self._clients))

    def _ensure_pubsub(self) -> None:
        if self._pubsub_task is None or self._pubsub_task.done():
            self._pubsub_task = asyncio.create_task(self._listen_redis())
            logger.info("%s Redis pubsub listener started", self._label)

    def _ensure_flush(self) -> None:
        if self._flush_task is None or self._flush_task.done():
            self._flush_task = asyncio.create_task(self._flush_loop())

    async def _flush_loop(self) -> None:
        while True:
            await asyncio.sleep(WS_SEND_INTERVAL)
            async with self._lock:
                dead: list[WebSocket] = []
                for ws, pending in self._pending.items():
                    if not pending:
                        continue
                    batch = list(pending.values())
                    pending.clear()
                    try:
                        await ws.send_text("[" + ",".join(batch) + "]")
                    except Exception:
                        dead.append(ws)
                for ws in dead:
                    self._clients.discard(ws)
                    self._pending.pop(ws, None)

    def _queue_message(self, ws: WebSocket, ticker: str, data: str) -> None:
        pending = self._pending.get(ws)
        if pending is not None:
            pending[ticker] = data

    async def _listen_redis(self) -> None:
        while True:
            r = None
            pubsub = None
            try:
                r = aioredis.from_url(
                    settings.REDIS_URL,
                    decode_responses=True,
                    retry_on_timeout=True,
                    socket_timeout=5,
                    socket_connect_timeout=5,
                    health_check_interval=30,
                )
                pubsub = r.pubsub()
                await pubsub.subscribe(self._channel)

                while True:
                    msg = await pubsub.get_message(
                        ignore_subscribe_messages=True, timeout=1.0
                    )
                    if msg is None:
                        await asyncio.sleep(0.01)
                        continue
                    if msg["type"] != "message":
                        continue

                    data = msg["data"]
                    try:
                        parsed = json.loads(data)
                        ticker = parsed.get("ticker", "")
                    except Exception:
                        continue

                    async with self._lock:
                        for ws in self._clients:
                            self._queue_message(ws, ticker, data)

            except asyncio.CancelledError:
                break
            except Exception:
                logger.exception("%s Redis pubsub error, reconnecting in 2s", self._label)
                await asyncio.sleep(2)
            finally:
                if pubsub:
                    try:
                        await pubsub.unsubscribe()
                        await pubsub.aclose()
                    except Exception:
                        pass
                if r:
                    try:
                        await r.aclose()
                    except Exception:
                        pass

class ConnectionManager(BroadcastManager):

    def __init__(self) -> None:
        super().__init__(channel=PUBSUB_CHANNEL, label="WS")
        self._subscriptions: dict[WebSocket, set[str]] = {}
        self._symbol_counts: dict[str, int] = {}

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()
        async with self._lock:
            self._clients.add(ws)
            self._subscriptions[ws] = set()
            self._pending[ws] = {}
            logger.info("WS client connected (%d total)", len(self._clients))
        self._ensure_pubsub()
        self._ensure_flush()

    async def disconnect(self, ws: WebSocket) -> None:
        async with self._lock:
            self._clients.discard(ws)
            symbols = self._subscriptions.pop(ws, set())
            self._pending.pop(ws, None)
            for sym in symbols:
                self._symbol_counts[sym] = self._symbol_counts.get(sym, 1) - 1
                if self._symbol_counts[sym] <= 0:
                    del self._symbol_counts[sym]
            self._sync_stream_subs()
            logger.info("WS client disconnected (%d remaining)", len(self._clients))

    async def subscribe(self, ws: WebSocket, symbols: list[str]) -> None:
        async with self._lock:
            current = self._subscriptions.get(ws, set())
            new_global = []
            for sym in symbols:
                s = sym.upper()
                current.add(s)
                prev = self._symbol_counts.get(s, 0)
                self._symbol_counts[s] = prev + 1
                if prev == 0:
                    new_global.append(s)
            self._subscriptions[ws] = current
            if new_global:
                stream.subscribe(new_global)
                logger.info("WS: new stream subs %s", new_global)

    async def unsubscribe(self, ws: WebSocket, symbols: list[str]) -> None:
        async with self._lock:
            current = self._subscriptions.get(ws, set())
            removed_global = []
            for sym in symbols:
                s = sym.upper()
                if s in current:
                    current.discard(s)
                    self._symbol_counts[s] = self._symbol_counts.get(s, 1) - 1
                    if self._symbol_counts[s] <= 0:
                        del self._symbol_counts[s]
                        removed_global.append(s)
            self._subscriptions[ws] = current
            if removed_global:
                stream.unsubscribe(removed_global)

    def _sync_stream_subs(self) -> None:
        all_needed = set(self._symbol_counts.keys())
        stream.subscribe(list(all_needed)) if all_needed else None

    def _queue_message(self, ws: WebSocket, ticker: str, data: str) -> None:
        if ticker in self._subscriptions.get(ws, set()):
            pending = self._pending.get(ws)
            if pending is not None:
                pending[ticker] = data

manager = ConnectionManager()

doviz_manager = BroadcastManager(
    channel="quotes:doviz",
    label="Doviz WS",
)

crypto_manager = BroadcastManager(
    channel="quotes:crypto",
    label="Crypto WS",
)

@router.websocket("/ws/quotes")
async def websocket_quotes(ws: WebSocket) -> None:
    await manager.connect(ws)
    try:
        while True:
            raw = await ws.receive_text()
            try:
                msg = json.loads(raw)
                action = msg.get("action")
                symbols = msg.get("symbols", [])
                if action == "subscribe" and symbols:
                    await manager.subscribe(ws, symbols)
                elif action == "unsubscribe" and symbols:
                    await manager.unsubscribe(ws, symbols)
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        pass
    finally:
        await manager.disconnect(ws)

@router.websocket("/ws/doviz")
async def websocket_doviz(ws: WebSocket) -> None:
    await doviz_manager.connect(ws)
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        await doviz_manager.disconnect(ws)

@router.websocket("/ws/crypto")
async def websocket_crypto(ws: WebSocket) -> None:
    await crypto_manager.connect(ws)
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        await crypto_manager.disconnect(ws)
