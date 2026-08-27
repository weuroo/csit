# Mission #18 — Controlled Internet Fast Path (PREP ONLY)

Status: PRE-STAGED / DO NOT MERGE OR DEPLOY DURING FEATURE FREEZE

Goal: minimize elapsed time from Stabilization Exit to the first verified real HTTPS read while preserving Owner Security Root and fail-closed controls.

## Mandatory sequence

1. Confirm Stabilization Exit and all safety regressions pass.
2. Re-read current Operating Manual + live schema; rebase/update this package if state changed.
3. Apply reviewed post-freeze SQL package implementing only:
   - `pm_internet_transport_proof_bounded_unlock_v1`
   - `pm_internet_create_command_bound_pilot_grant_v1`
   - `pm_internet_transport_proof_reserve_request_v1`
   - `pm_internet_transport_proof_finalize_request_v1`
4. Run `post_apply_verification.sql.disabled` after converting it into an explicitly reviewed execution step.
5. Require machine-readable implementation contract validation + authority-surface regression.
6. Promote only an attested executor artifact to `APPROVED_FOR_PILOT`; no general production network authority.
7. Deploy a separate proof-only edge artifact conforming to `proof_executor_contract.ts.disabled`, fixed to `https://example.com/`, one request maximum.
8. Only after technical implementation is complete, request fresh Owner Passkey approval using v3 intent.
9. Phase A: bounded Owner Lockdown release, scope `TRANSPORT_PROOF_SINGLE_REQUEST`, <=120 seconds, general production network remains false.
10. Phase B: promotion verifier full pass; create exact-command-bound 10-minute `PAOJAI_OPERATIONS_AI` / `PUBLIC_READ` grant.
11. Atomically reserve the one request slot before any DNS or network side effect.
12. Execute pinned-IP TLS proof; same-host redirects only, max 3, timeout <=10s, response <=1 MiB, full audit.
13. Collect direct DNS connect-time, redirect revalidation and runtime concurrency evidence.
14. Immediately relock, expire/revoke grant, finalize request token idempotently, run Safety + Authority + Contract + Concurrency + Recovery regressions.
15. Complete only if Production evidence has `network_request_performed=true` for exactly one allowed request and post-request lockdown is verified.

## Merge / activation gate

This PR MUST remain draft and unmerged while Feature Freeze is active. After Stabilization Exit it still MUST NOT be merged/applied blindly. Before any merge/apply, re-check current Manual + Production schema and require current live safety evidence. If any contract, schema, artifact hash, Owner-security requirement or privilege model changed, update/re-review this package first.

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
