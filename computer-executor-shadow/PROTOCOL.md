# Computer Executor Shadow Protocol v1

## Purpose

Prove a real Owner computer can participate as an authenticated, revocable PM Agency Intelligence OS device **without granting execution authority**.

## Trust model

Presence is not authority. A network connection, hostname, IP address, OS account, display name, voice, chat message, or agent self-claim does not establish Owner authority.

The future chain is:

`Local Device Crypto Identity -> Owner Device Binding -> Fresh Owner Auth when required -> Signed Command -> Nonce/Expiry -> Capability Grant -> Central Action Gate -> Local Permission Gate -> Action -> Audit -> Outcome`

Shadow v1 stops before `Action`.

## Transport

- Local agent initiates outbound HTTPS only.
- No inbound listening port.
- Fixed PM-controlled server hostname allowlist.
- No redirect following to unapproved hosts.
- Bounded request timeout and response size.
- No local-network discovery.
- No arbitrary URL fetch capability.

## Heartbeat envelope

The prototype signs a canonical JSON payload with an Ed25519 device key. Heartbeat metadata is intentionally minimal:

- schema version
- shadow mode
- agent version
- device key derived from public key
- public key
- issued timestamp
- random nonce
- OS family
- machine architecture
- declared capability: `COMPUTER_HEARTBEAT`
- explicit false flags for content access and execution authority

Heartbeat must contain no screen pixels, clipboard, file names/content, browser history, typed text, passwords, tokens, client data, app contents or local-network information.

## Server-side acceptance requirements

A future isolated Shadow enrollment endpoint must:

1. Reject non-Shadow envelopes.
2. Verify payload schema and size.
3. Verify Ed25519 signature.
4. Reject reused nonces and stale timestamps.
5. Register a new device as `QUARANTINED_SHADOW` only.
6. Never infer Owner binding from the heartbeat itself.
7. Require a separate verified Owner binding flow.
8. Write full audit evidence.
9. Never create capability grants automatically.
10. Never enable execution or sensor authority.

## First proof Definition of Done

The first real-computer test is successful only when:

- one real Owner computer initializes a unique key pair
- one heartbeat reaches the isolated endpoint
- signature verifies
- nonce is accepted once and replay is rejected
- no user content is transmitted
- device remains `QUARANTINED_SHADOW`
- execution authority remains false
- local emergency stop blocks further heartbeat
- all evidence is auditable

No screen observation or computer control is part of this first proof.

## Promotion philosophy

Capabilities are promoted independently. Passing heartbeat does not promote screen, files, browser, apps, shell or input control. A capability must have its own threat model, safety tests, Owner approval and rollback path.
