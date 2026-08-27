#!/usr/bin/env python3
"""Paojai Computer Execution Shadow Agent v0.1.

Shadow-only local agent. It proves device identity and heartbeat transport only.
It intentionally has no screen, clipboard, file-content, shell, app-control,
input-injection, browser-control, or local-network capabilities.
"""

from __future__ import annotations

import argparse
import base64
import hashlib
import json
import os
import platform
import stat
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

AGENT_VERSION = "0.1.0-shadow"
DEFAULT_ALLOWED_HOST = "bvnmwfhqgdevupvcqqyl.supabase.co"


def b64u(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def data_dir() -> Path:
    if sys.platform == "win32":
        root = Path(os.environ.get("LOCALAPPDATA", Path.home()))
        return root / "PaojaiComputerShadow"
    if sys.platform == "darwin":
        return Path.home() / "Library" / "Application Support" / "PaojaiComputerShadow"
    return Path(os.environ.get("XDG_DATA_HOME", Path.home() / ".local" / "share")) / "paojai-computer-shadow"


def key_path() -> Path:
    return data_dir() / "device_ed25519_private.pem"


def estop_path() -> Path:
    return data_dir() / "EMERGENCY_STOP"


def ensure_dir() -> None:
    d = data_dir()
    d.mkdir(parents=True, exist_ok=True)
    try:
        os.chmod(d, stat.S_IRWXU)
    except OSError:
        pass


def load_or_create_key() -> Ed25519PrivateKey:
    ensure_dir()
    p = key_path()
    if p.exists():
        raw = p.read_bytes()
        return serialization.load_pem_private_key(raw, password=None)

    key = Ed25519PrivateKey.generate()
    pem = key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )
    p.write_bytes(pem)
    try:
        os.chmod(p, stat.S_IRUSR | stat.S_IWUSR)
    except OSError:
        pass
    return key


def public_identity(key: Ed25519PrivateKey) -> tuple[str, str]:
    pub = key.public_key().public_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PublicFormat.Raw,
    )
    device_key = "computer_" + hashlib.sha256(pub).hexdigest()[:32]
    return device_key, b64u(pub)


def assert_shadow_safe() -> None:
    if estop_path().exists():
        raise RuntimeError(f"Emergency stop active: {estop_path()}")


def validate_endpoint(endpoint: str) -> str:
    parsed = urllib.parse.urlparse(endpoint)
    allowed_host = os.environ.get("PM_COMPUTER_SHADOW_ALLOWED_HOST", DEFAULT_ALLOWED_HOST).strip().lower()
    if parsed.scheme != "https":
        raise ValueError("Shadow endpoint must use HTTPS")
    if not parsed.hostname or parsed.hostname.lower() != allowed_host:
        raise ValueError(f"Endpoint host is not allowlisted: expected {allowed_host}")
    return endpoint


def canonical_bytes(payload: dict) -> bytes:
    return json.dumps(payload, separators=(",", ":"), sort_keys=True, ensure_ascii=True).encode("utf-8")


def make_heartbeat(key: Ed25519PrivateKey) -> dict:
    device_key, pub = public_identity(key)
    nonce = b64u(os.urandom(18))
    body = {
        "schema": "PAOJAI_COMPUTER_SHADOW_HEARTBEAT_V1",
        "mode": "SHADOW",
        "agent_version": AGENT_VERSION,
        "device_key": device_key,
        "device_public_key_ed25519": pub,
        "issued_at_unix": int(time.time()),
        "nonce": nonce,
        "platform_family": platform.system(),
        "platform_machine": platform.machine(),
        "capabilities": ["COMPUTER_HEARTBEAT"],
        "content_access": False,
        "execution_authority": False,
        "sensor_authority": False,
        "shell_access": False,
        "file_write": False,
        "app_control": False,
        "local_network_access": False,
    }
    signature = key.sign(canonical_bytes(body))
    return {"payload": body, "signature_ed25519": b64u(signature)}


def heartbeat_once() -> int:
    assert_shadow_safe()
    endpoint = os.environ.get("PM_COMPUTER_SHADOW_ENDPOINT", "").strip()
    if not endpoint:
        print("PM_COMPUTER_SHADOW_ENDPOINT is not configured; no network request sent.", file=sys.stderr)
        return 2
    endpoint = validate_endpoint(endpoint)
    key = load_or_create_key()
    envelope = make_heartbeat(key)
    request = urllib.request.Request(
        endpoint,
        data=canonical_bytes(envelope),
        method="POST",
        headers={"Content-Type": "application/json", "User-Agent": f"paojai-computer-shadow/{AGENT_VERSION}"},
    )
    with urllib.request.urlopen(request, timeout=5) as response:
        data = response.read(64 * 1024)
        print(data.decode("utf-8", errors="replace"))
    return 0


def init_identity() -> int:
    assert_shadow_safe()
    key = load_or_create_key()
    device_key, pub = public_identity(key)
    print(json.dumps({
        "mode": "SHADOW",
        "device_key": device_key,
        "public_key_ed25519": pub,
        "private_key_path": str(key_path()),
        "execution_authority": False,
    }, indent=2))
    return 0


def activate_estop() -> int:
    ensure_dir()
    estop_path().write_text("OWNER_LOCAL_ESTOP\n", encoding="utf-8")
    print(f"Emergency stop activated: {estop_path()}")
    return 0


def status() -> int:
    print(json.dumps({
        "agent_version": AGENT_VERSION,
        "mode": "SHADOW",
        "identity_initialized": key_path().exists(),
        "emergency_stop_active": estop_path().exists(),
        "network_endpoint_configured": bool(os.environ.get("PM_COMPUTER_SHADOW_ENDPOINT", "").strip()),
        "execution_authority": False,
        "supported_operations": ["init", "heartbeat-once", "status", "estop"],
    }, indent=2))
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Paojai Computer Execution Shadow Agent")
    parser.add_argument("command", choices=["init", "heartbeat-once", "status", "estop"])
    args = parser.parse_args()
    try:
        if args.command == "init":
            return init_identity()
        if args.command == "heartbeat-once":
            return heartbeat_once()
        if args.command == "estop":
            return activate_estop()
        return status()
    except Exception as exc:
        print(f"FAIL_CLOSED: {type(exc).__name__}: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
