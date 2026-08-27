# Paojai Computer Execution Layer — Shadow v0.1

Status: **SHADOW ONLY — ZERO EXECUTION AUTHORITY**

This directory contains the first local-agent prototype for the PM Agency Intelligence OS Computer Execution Layer.

## Safety position

The agent currently supports only:

- local device identity initialization
- a single outbound HTTPS heartbeat
- local status
- local emergency stop

It does **not** support screen capture, clipboard access, file-content access, shell execution, file writes, keyboard/mouse injection, browser control, app control, password/payment capture, local-network discovery, outbound messages, publishing, purchases, campaign changes, or client actions.

The architecture order is:

1. API / connector first
2. governed browser automation second
3. bounded local computer execution last

The future local agent must initiate outbound transport only. No inbound remote-control port is allowed.

## Current production contract

Canonical policy lives in Supabase production tables:

- `pm_computer_executor_policy_v1`
- `pm_computer_capability_registry_v1`
- `pm_computer_device_registry_v1`
- `pm_computer_action_requests_shadow_v1`
- `pm_computer_action_audit_shadow_v1`
- `pm_computer_release_gate_v1`

The current policy mode is `SHADOW` and execution authority is false.

## Prototype usage

Requires Python 3.11+ and the `cryptography` package.

```bash
python -m pip install -r requirements.txt
python agent.py status
python agent.py init
```

A heartbeat is not sent unless `PM_COMPUTER_SHADOW_ENDPOINT` is explicitly configured. The prototype only accepts HTTPS to the allowlisted PM Supabase hostname.

```bash
PM_COMPUTER_SHADOW_ENDPOINT="https://bvnmwfhqgdevupvcqqyl.supabase.co/functions/v1/<shadow-endpoint>" python agent.py heartbeat-once
```

The receiving endpoint is intentionally not enabled by this branch yet. This prevents accidental enrollment or content exposure before the server-side enrollment contract is complete.

## Emergency stop

```bash
python agent.py estop
```

This creates a local `EMERGENCY_STOP` marker. When present, the agent fails closed before any heartbeat.

## Promotion gates

No local computer action may be enabled until all of the following are verified with evidence:

- real Owner computer enrolled
- cryptographic device identity verified
- Owner binding verified
- outbound transport verified
- signed command path verified
- nonce/replay protection verified
- local OS permission boundaries verified
- sensitive-data redaction verified
- duplicate prevention verified
- emergency stop verified
- rollback verified
- safety regression verified
- stabilization exit verified
- fresh Owner approval for each promoted capability

Whole-machine unrestricted remote control is explicitly outside the design.
