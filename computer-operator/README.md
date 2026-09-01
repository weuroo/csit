# Paojai Computer Operator v1 — Production Candidate

Status: **candidate / fail-closed / no production authority by default**.

This component implements the request-via-orchestrator computer-action path for PM Agency Intelligence OS. It is intentionally not a general remote shell or unrestricted desktop controller.

## Authority model

- Sovereign Owner remains root authority.
- AI agents request work through Paojai/orchestrator; agents do not receive raw OS authority.
- The Windows runtime executes only a short-lived, server-issued lease containing a preauthorized command batch.
- Capability is disabled before/after every lease and the computer circuit breaker is open outside the lease.
- High-impact actions (money/price/ads/publish/contracts/legal/HR/data deletion/disclosure/security root/material client impact) are excluded and require their own approval path.
- No persistent execution or sensor authority is inferred from the runtime being online.

## Local runtime safety

Allowed command families only:
- foreground allowlisted-window screenshot
- focus allowlisted window
- mouse move
- left click
- bounded Unicode typing
- bounded named keys

Blocked in the runtime contract:
- shell/process command execution
- arbitrary file read/write
- clipboard
- network discovery
- credential/payment/recovery surfaces
- right/double click and drag
- high-impact action bundles

Screen capture is limited to the foreground allowlisted window and supports server-provided mask rectangles. Raw screenshot bytes are not persisted by the candidate server completion path.

The local Ed25519 private key is protected with Windows DPAPI. The first owner-specific build receives a one-time enrollment token via linker injection; the token is never committed to source and is consumed on first candidate registration.

## Build

Generic source build (cannot self-enroll because it contains no enrollment token):

```bash
GOOS=windows GOARCH=amd64 go build -o paojai-computer-operator-v1.exe .
```

Owner-specific candidate build is produced outside source control with an ephemeral one-time token:

```bash
GOOS=windows GOARCH=amd64 go build \
  -ldflags "-X main.buildEnrollmentToken=<ephemeral-one-time-token>" \
  -o paojai-computer-operator-v1.exe .
```

Never commit the token or private-key material.

## Release sequence

1. Candidate runtime registers a new PENDING cryptographic device identity and emits signed heartbeat.
2. Exact Owner Passkey binds the candidate device and authorizes a narrow real-app pilot.
3. Run reversible real-app proof (safe test surface only), stop/rollback proof, and relevant safety regressions.
4. Only after direct evidence may the capability/device be promoted to production.
5. Production execution remains short-lease + preauthorized queue + circuit breaker + audit; semantic outcome verification is separate.

Do not complete this project by flipping database flags alone.
