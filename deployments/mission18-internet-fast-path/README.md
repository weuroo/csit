# Mission #18 — Controlled Internet Fast Path (PREP ONLY)

Status: PRE-STAGED / DO NOT MERGE OR DEPLOY DURING FEATURE FREEZE

Goal: minimize elapsed time from Stabilization Exit to the first verified real HTTPS read while preserving Owner Security Root and fail-closed controls.

## Mandatory sequence

1. Confirm Stabilization Exit and all safety regressions pass.
2. Apply reviewed post-freeze SQL package implementing only:
   - `pm_internet_transport_proof_bounded_unlock_v1`
   - `pm_internet_create_command_bound_pilot_grant_v1`
   - `pm_internet_transport_proof_reserve_request_v1`
   - `pm_internet_transport_proof_finalize_request_v1`
3. Run machine-readable implementation contract validation and authority-surface regression.
4. Promote only an attested executor artifact to `APPROVED_FOR_PILOT`; no general production network authority.
5. Deploy a separate proof-only edge artifact fixed to `https://example.com/`, one request maximum.
6. Only after technical implementation is complete, request fresh Owner Passkey approval using v3 intent.
7. Phase A: bounded Owner Lockdown release, scope `TRANSPORT_PROOF_SINGLE_REQUEST`, <=120 seconds, general production network remains false.
8. Phase B: promotion verifier full pass; create exact-command-bound 10-minute `PAOJAI_OPERATIONS_AI` / `PUBLIC_READ` grant.
9. Atomically reserve the one request slot before any DNS or network side effect.
10. Execute pinned-IP TLS proof; same-host redirects only, max 3, timeout <=10s, response <=1 MiB, full audit.
11. Collect direct DNS connect-time and redirect revalidation evidence.
12. Immediately relock, expire/revoke grant, finalize request token idempotently, run Safety + Authority + Concurrency + Recovery regressions.
13. Complete only if Production evidence has `network_request_performed=true` for exactly one allowed request and post-request lockdown is verified.

## Fail-closed invariants

- No caller-supplied `signature_verified` is authority.
- Exact VERIFIED v3 owner command required for unlock and grant creation.
- No `anon`, `authenticated`, or `PUBLIC` EXECUTE on Mission #18 write functions.
- No credentials, downloads, code execution, external side effects, protected-data egress, or cross-client context.
- Request reservation policy: `FAIL_CLOSED_CONSUME_ON_RESERVATION_NO_AUTORELEASE`.
- A failed DNS/TLS/timeout/network attempt still consumes the one request slot; retry requires new evidence review and fresh Owner approval/reset.
- Approval endpoint itself never unlocks, creates grant, enables proof lane, or enables network.
- Proof artifact is separate from the general executor.

## Current known live blockers (must be re-read, never assumed)

- Stabilization Exit Gate
- DNS rebinding connect-time evidence
- Redirect connect-time evidence
- Production atomic consume/runtime concurrency proof

This branch is preparation only. Production activation remains evidence-gated.