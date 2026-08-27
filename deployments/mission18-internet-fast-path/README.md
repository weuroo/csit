# Mission #18 — Controlled Internet Fast Path (PREP ONLY)

Status: PRE-STAGED / DO NOT MERGE OR DEPLOY DURING FEATURE FREEZE

Goal: minimize elapsed time from Stabilization Exit to the first verified real HTTPS read while preserving Owner Security Root and fail-closed controls.

Canonical proof target after reviewed post-freeze binding:
`https://paojai-mission-control-hub.vercel.app/api/internet-proof-redirect`

## Mandatory sequence

1. Confirm Stabilization Exit and all safety regressions pass.
2. Re-read current Operating Manual + live schema; rebase/update this package if state changed.
3. Deploy and verify the PM-owned deterministic proof target: same-host 302 -> final 200, no state mutation.
4. Apply reviewed target-binding + schema-bound SQL package implementing only:
   - `pm_internet_transport_proof_bounded_unlock_v1`
   - `pm_internet_create_command_bound_pilot_grant_v1`
   - `pm_internet_transport_proof_reserve_request_v1`
   - `pm_internet_transport_proof_finalize_request_v1`
5. Run canonical-name readiness + cross-binding verification.
6. Require implementation contract validation + authority-surface regression.
7. Promote only an attested proof executor artifact to `APPROVED_FOR_PILOT`; no general production network authority.
8. Deploy a separate proof-only executor fixed to the canonical PM-owned target, one request maximum.
9. Only after technical implementation and target binding are complete, request fresh Owner Passkey approval using exact v3 intent.
10. Phase A: bounded Owner Lockdown release, scope `TRANSPORT_PROOF_SINGLE_REQUEST`, <=120 seconds, general production network remains false.
11. Phase B: create exact-command-bound 10-minute `PAOJAI_OPERATIONS_AI` / `PUBLIC_READ` grant.
12. Atomically reserve the one request slot before DNS or any network side effect.
13. Execute pinned-IP TLS proof; observe real same-host redirect, re-gate/re-resolve, max 3 redirects, timeout <=10s, response <=1 MiB.
14. Collect direct DNS connect-time + redirect connect-time evidence from that real request.
15. Immediately finalize, relock, revoke/expire grant, then run Safety + Authority + Contract + Concurrency + Recovery regressions.
16. Complete only if Production evidence has exactly one consumed request, `network_request_performed=true`, direct DNS/redirect evidence, and post-request lockdown verified.

## Merge / activation gate

This PR MUST remain draft and unmerged while Feature Freeze is active. After Stabilization Exit it still MUST NOT be merged/applied blindly. Before merge/apply, re-check current Manual + Production schema and require current live safety evidence. If any contract, schema, artifact hash, Owner-security requirement, target origin or privilege model changed, update/re-review first.

## Fail-closed invariants

- No caller-supplied `signature_verified` is authority.
- Exact VERIFIED v3 Owner command required for unlock and grant creation.
- No `anon`, `authenticated`, or `PUBLIC` EXECUTE on Mission #18 mutation functions.
- No credentials, downloads, code execution, external side effects, protected-data egress, or cross-client context.
- `production_network_enabled` remains false throughout the proof mission.
- Request policy: `FAIL_CLOSED_CONSUME_ON_RESERVATION_NO_AUTORELEASE`.
- A failed DNS/TLS/timeout/network attempt still consumes the one request slot; retry requires new review and fresh Owner approval/reset.
- Approval endpoint itself never unlocks, creates grant, enables proof lane, or enables network.
- Proof executor is separate from the general executor.
- Shadow/readiness evidence never counts as Owner authority or real network proof.
- No fallback to `example.com`, aliases, wildcards, caller-supplied target URLs, or cross-host redirects.

## Current known live blockers (must be re-read, never assumed)

- Stabilization Exit Gate
- Post-freeze apply/deploy of reviewed control-plane + proof artifacts
- Fresh cryptographic Owner Passkey command after technical readiness
- First real bounded request to generate DNS/redirect runtime evidence

This branch is preparation only. Production activation remains evidence-gated.
