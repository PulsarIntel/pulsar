import asyncio
import json
import logging
import random
import time

import redis.asyncio as aioredis
import websockets

from finance.core.config import settings
from finance.services.providers.base import MarketDataProvider

"""
Doviz.com real-time data provider.

IMPORTANT: This provider connects to doviz.com's WebSocket endpoint to receive
real-time Turkish currency, gold, and precious metal prices. The connection uses
browser-like headers to maintain compatibility with their WebSocket protocol.

If you deploy this provider, ensure you comply with doviz.com's terms of service.
The data received is for informational purposes only and should not be used for
trading decisions without independent verification.

For commercial use, consider contacting doviz.com for an official API agreement.
"""

logger = logging.getLogger("finance.doviz")

PUBSUB_CHANNEL = "quotes:doviz"
REDIS_KEY = "doviz:quotes"
THROTTLE_INTERVAL = 0.3
REDIS_COOLDOWN_SECS = 10

ICON_BASE = f"{settings.CDN_BASE_URL}/bank-icons" if settings.CDN_BASE_URL else ""

BANK_MAP: dict[int, dict] = {
    1:  {"name": "Akbank", "icon": f"{ICON_BASE}/akbank.png"},
    2:  {"name": "QNB Finansbank", "icon": f"{ICON_BASE}/qnb-finansbank.png"},
    3:  {"name": "Halkbank", "icon": f"{ICON_BASE}/halkbank.png"},
    4:  {"name": "İş Bankası", "icon": f"{ICON_BASE}/isbankasi.png"},
    5:  {"name": "Vakıfbank", "icon": f"{ICON_BASE}/vakifbank.png"},
    6:  {"name": "Yapıkredi", "icon": f"{ICON_BASE}/yapikredi.png"},
    7:  {"name": "Ziraat Bankası", "icon": f"{ICON_BASE}/ziraat-bankasi.png"},
    8:  {"name": "Garanti BBVA", "icon": f"{ICON_BASE}/garanti-bbva.png"},
    9:  {"name": "Şekerbank", "icon": f"{ICON_BASE}/sekerbank.png"},
    10: {"name": "Denizbank", "icon": f"{ICON_BASE}/denizbank.png"},
    11: {"name": "Merkez Bankası", "icon": f"{ICON_BASE}/merkez-bankasi.png"},
    12: {"name": "HSBC", "icon": f"{ICON_BASE}/hsbc.png"},
    13: {"name": "Türkiye Finans", "icon": f"{ICON_BASE}/turkiye-finans.png"},
    14: {"name": "Ziraat Katılım", "icon": f"{ICON_BASE}/ziraat-katilim.png"},
    15: {"name": "Vakıf Katılım", "icon": f"{ICON_BASE}/vakif-katilim.png"},
    16: {"name": "ING Bank", "icon": f"{ICON_BASE}/ing-bank.png"},
    17: {"name": "Kuveyt Türk", "icon": f"{ICON_BASE}/kuveyt-turk.png"},
    18: {"name": "Albaraka Türk", "icon": f"{ICON_BASE}/albaraka-turk.png"},
    19: {"name": "Enpara", "icon": f"{ICON_BASE}/enpara.png"},
    20: {"name": "Kapalıçarşı", "icon": f"{ICON_BASE}/kapalicarsi.png"},
    21: {"name": "Venüs", "icon": f"{ICON_BASE}/venus.png"},
    22: {"name": "Odacı", "icon": f"{ICON_BASE}/odaci.png"},
    23: {"name": "Harem", "icon": f"{ICON_BASE}/harem.png"},
    24: {"name": "Altınkaynak", "icon": f"{ICON_BASE}/altinkaynak.png"},
    25: {"name": "CEPTETEB", "icon": f"{ICON_BASE}/cepteteb.png"},
    26: {"name": "Anadolubank", "icon": f"{ICON_BASE}/anadolubank.png"},
    27: {"name": "Alternatif Bank", "icon": f"{ICON_BASE}/alternatif-bank.png"},
    28: {"name": "Papara", "icon": f"{ICON_BASE}/papara.png"},
    29: {"name": "Hayat Finans", "icon": f"{ICON_BASE}/hayat-finans.png"},
    30: {"name": "Emlak Katılım", "icon": f"{ICON_BASE}/emlak-katilim.png"},
    31: {"name": "Fibabanka", "icon": f"{ICON_BASE}/fibabanka.png"},
    32: {"name": "DestekBank", "icon": f"{ICON_BASE}/destekbank.png"},
    33: {"name": "Hepsipay", "icon": f"{ICON_BASE}/hepsipay.png"},
    36: {"name": "Odeabank", "icon": f"{ICON_BASE}/odeabank.png"},
    37: {"name": "Getirfinans", "icon": f"{ICON_BASE}/getirfinans.png"},
    38: {"name": "Dünya Katılım", "icon": f"{ICON_BASE}/dunya-katilim.png"},
    39: {"name": "Hadi / TOMBank", "icon": f"{ICON_BASE}/hadi.png"},
    40: {"name": "Misyon Bank", "icon": f"{ICON_BASE}/misyon-bank.png"},
}

ASSET_LABELS = {
    "gram-altin": "Gram Gold",
    "gumus": "Silver",
    "USD": "US Dollar",
    "EUR": "Euro",
    "GBP": "British Pound",
}

CORE_SYMBOLS: dict[str, dict] = {
    "gram-altin": {"name": "Gram Gold", "category": "gold"},
    "gram-has-altin": {"name": "Has Gold (Gr)", "category": "gold"},
    "ceyrek-altin": {"name": "Çeyrek Gold", "category": "gold"},
    "yarim-altin": {"name": "Yarım Gold", "category": "gold"},
    "tam-altin": {"name": "Tam Gold", "category": "gold"},
    "cumhuriyet-altini": {"name": "Cumhuriyet Gold", "category": "gold"},
    "ata-altin": {"name": "Ata Gold", "category": "gold"},
    "resat-altin": {"name": "Reşat Gold", "category": "gold"},
    "hamit-altin": {"name": "Hamit Gold", "category": "gold"},
    "ikibucuk-altin": {"name": "İkibuçuk Gold", "category": "gold"},
    "besli-altin": {"name": "Beşli Gold", "category": "gold"},
    "gremse-altin": {"name": "Gremse Gold", "category": "gold"},
    "14-ayar-altin": {"name": "14K Gold", "category": "gold"},
    "18-ayar-altin": {"name": "18K Gold", "category": "gold"},
    "22-ayar-bilezik": {"name": "22K Bilezik", "category": "gold"},
    "ons": {"name": "Ons Gold", "category": "gold"},
    "gumus": {"name": "Silver (USD/oz)", "category": "silver"},
    "gram-platin": {"name": "Gram Platinum", "category": "precious_metals"},
    "gram-paladyum": {"name": "Gram Palladium", "category": "precious_metals"},
    "USD": {"name": "US Dollar", "category": "currency"},
    "EUR": {"name": "Euro", "category": "currency"},
    "GBP": {"name": "British Pound", "category": "currency"},
    "XU100": {"name": "BIST 100", "category": "index"},
}

BANK_NUMS = list(BANK_MAP.keys())

DOVIZ_SYMBOLS: dict[str, dict] = {**CORE_SYMBOLS}

BANK_ASSETS = {
    "gumus": "silver",
    "USD": "currency",
    "EUR": "currency",
    "GBP": "currency",
    "gram-altin": "gold",
}

for asset_key, cat in BANK_ASSETS.items():
    for n in BANK_NUMS:
        bank = BANK_MAP[n]
        key = f"{n}-{asset_key}"
        DOVIZ_SYMBOLS[key] = {
            "name": f"{bank['name']}",
            "category": cat,
            "bank_id": n,
            "bank_name": bank["name"],
            "bank_icon": bank["icon"],
            "asset": asset_key,
            "asset_label": ASSET_LABELS.get(asset_key, asset_key),
        }

DOVIZ_CATEGORY_LABELS: dict[str, str] = {
    "gold": "Gold",
    "silver": "Silver",
    "precious_metals": "Precious Metals",
    "currency": "Currency",
    "index": "Index",
}

def _normalize(msg: dict) -> dict | None:
    if msg.get("a") != "m":
        return None
    m = msg.get("m", {})
    key = m.get("k", "")
    meta = DOVIZ_SYMBOLS.get(key)
    if meta is None:
        return None
    result = {
        "type": "doviz_quote",
        "provider": "doviz",
        "ticker": key,
        "name": meta["name"],
        "category": meta["category"],
        "price": m.get("sn", 0),
        "bid": m.get("bid", 0),
        "ask": m.get("ask", 0),
        "change": m.get("an", 0),
        "changePercent": m.get("cn", 0),
        "weeklyChange": m.get("anw", 0),
        "weeklyChangePercent": m.get("cnw", 0),
        "monthlyChange": m.get("anm", 0),
        "monthlyChangePercent": m.get("cnm", 0),
        "yearlyChange": m.get("any", 0),
        "yearlyChangePercent": m.get("cny", 0),
        "low": m.get("ln", 0),
        "high": m.get("hn", 0),
        "timestamp": m.get("ts", 0),
    }
    if "bank_id" in meta:
        result["bankId"] = meta["bank_id"]
        result["bankName"] = meta["bank_name"]
        result["bankIcon"] = meta["bank_icon"]
        result["asset"] = meta["asset"]
        result["assetLabel"] = meta["asset_label"]
    return result

class DovizProvider(MarketDataProvider):
    def __init__(self) -> None:
        self._task: asyncio.Task | None = None
        self._redis: aioredis.Redis | None = None
        self._redis_cooldown_until: float = 0
        self._pending: dict[str, dict] = {}
        self._flush_task: asyncio.Task | None = None

    @property
    def name(self) -> str:
        return "doviz"

    @property
    def pubsub_channel(self) -> str:
        return PUBSUB_CHANNEL

    @property
    def symbols(self) -> list[str]:
        return list(DOVIZ_SYMBOLS.keys())

    def start(self, loop: asyncio.AbstractEventLoop) -> None:
        self._task = loop.create_task(self._run())
        self._flush_task = loop.create_task(self._flush_loop())

    async def stop(self) -> None:
        if self._flush_task:
            self._flush_task.cancel()
        if self._task:
            self._task.cancel()
        if self._redis:
            await self._redis.aclose()
            self._redis = None

    async def _get_redis(self) -> aioredis.Redis:
        if self._redis is None:
            self._redis = aioredis.from_url(
                settings.REDIS_URL,
                decode_responses=True,
                retry_on_timeout=True,
                socket_timeout=5,
                socket_connect_timeout=5,
                health_check_interval=30,
                single_connection_client=True,
            )
        return self._redis

    async def _publish(self, data: dict) -> None:
        if time.monotonic() < self._redis_cooldown_until:
            return
        try:
            r = await self._get_redis()
            pipe = r.pipeline()
            pipe.publish(PUBSUB_CHANNEL, json.dumps(data))
            pipe.hset(REDIS_KEY, data["ticker"], json.dumps(data))
            await pipe.execute()
        except Exception as e:
            self._redis_cooldown_until = time.monotonic() + REDIS_COOLDOWN_SECS
            logger.warning("Redis publish failed, cooling down: %s", e)
            try:
                if self._redis:
                    await self._redis.aclose()
            except Exception:
                pass
            self._redis = None

    async def _flush_loop(self) -> None:
        while True:
            await asyncio.sleep(THROTTLE_INTERVAL)
            if not self._pending:
                continue
            batch = dict(self._pending)
            self._pending.clear()
            for data in batch.values():
                await self._publish(data)

    async def _run(self) -> None:
        backoff = 1
        max_backoff = 60

        while True:
            try:
                async with websockets.connect(
                    settings.DOVIZ_WS_URL,
                    subprotocols=["nokta-chat-json"],
                    ping_interval=None,
                    close_timeout=5,
                    additional_headers={
                        "Origin": "https://altin.doviz.com",
                        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
                    },
                ) as ws:
                    logger.info("Connected to doviz.com WebSocket")
                    backoff = 1

                    room = "info@" + ",".join(DOVIZ_SYMBOLS.keys())
                    nick = f"webkullanici_{random.randint(100, 999)}"
                    auth_msg = json.dumps(
                        {
                            "action": "auth",
                            "data": {
                                "username": "",
                                "password": "",
                                "joinTo": f"{room}/{nick}",
                            },
                        },
                        separators=(",", ":"),
                    )
                    await ws.send(auth_msg)

                    async for raw in ws:
                        try:
                            msg = json.loads(raw)
                            normalized = _normalize(msg)
                            if normalized:
                                self._pending[normalized["ticker"]] = normalized
                        except json.JSONDecodeError:
                            continue

            except asyncio.CancelledError:
                logger.info("Doviz provider task cancelled")
                break
            except Exception:
                logger.exception(
                    "Doviz WebSocket error, reconnecting in %ds", backoff
                )
                await asyncio.sleep(backoff)
                backoff = min(backoff * 2, max_backoff)
