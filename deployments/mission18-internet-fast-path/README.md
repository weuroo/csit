# Mission #18 — Controlled Internet Fast Path (PREP ONLY)

Status: PRE-STAGED / DO NOT MERGE OR DEPLOY DURING FEATURE FREEZE

Goal: minimize elapsed time from Stabilization Exit to the first verified real HTTPS read while preserving Owner Security Root and fail-closed controls.

Canonical proof target:
`https://example.com/`

## Mandatory sequence

1. Confirm Stabilization Exit and all safety regressions pass.
2. Re-read current Operating Manual + live schema; rebase/update this package if state changed.
3. Confirm the Production proof lane remains hard-bound to exact `https://example.com/`; no PM-owned redirect target, alias, wildcard, fallback, or caller-selected URL is allowed.
4. Apply the reviewed schema-bound SQL package implementing only:
   - `pm_internet_transport_proof_bounded_unlock_v1`
   - `pm_internet_create_command_bound_pilot_grant_v1`
   - `pm_internet_transport_proof_reserve_request_v1`
   - `pm_internet_transport_proof_finalize_request_v1`
5. Run canonical-name readiness + cross-binding verification.
6. Require implementation contract validation + authority-surface regression.
7. Promote only an attested proof executor artifact to `APPROVED_FOR_PILOT`; no general production network authority.
8. Deploy a separate proof-only executor fixed to exact `https://example.com/`, one request maximum.
9. Run the runtime concurrency harness as soon as Production atomic reservation exists; require exactly one winner and zero DNS/network side effect during the harness.
10. Only after technical implementation is complete and all required gates pass, request fresh Owner Passkey approval using exact v3 intent.
11. Phase A: bounded Owner Lockdown release, scope `TRANSPORT_PROOF_SINGLE_REQUEST`, <=120 seconds, general production network remains false.
12. Phase B: create exact-command-bound <=10-minute `PAOJAI_OPERATIONS_AI` / `PUBLIC_READ` grant.
13. Atomically reserve the one request slot before DNS or any network side effect.
14. Execute pinned-IP TLS proof to exact `https://example.com/`; same-host HTTPS redirects only if observed, max 3, timeout <=10s, response <=1 MiB.
15. Collect direct DNS connect-time evidence and redirect revalidation evidence for every redirect actually followed; zero redirects must be recorded explicitly rather than fabricated as redirect evidence.
16. Immediately finalize idempotently, relock, revoke/expire grant, then run Central/Action/Guardian + Authority + Contract + Concurrency/Failure Policy + Recovery/Kill-Switch checks.
17. Complete only if Production evidence has exactly one consumed request, `network_request_performed=true`, a valid bounded response, DNS/redirect policy evidence passed, no Critical regression, zero active PAOJAI PUBLIC_READ grants, Owner Lockdown restored, general Production network false, and Recovery/Kill-Switch verified.

## Merge / activation gate

This PR MUST remain draft and unmerged while Feature Freeze is active. After Stabilization Exit it still MUST NOT be merged/applied blindly. Before merge/apply, re-check current Manual + Production schema and require current live safety evidence. If any contract, schema, artifact hash, Owner-security requirement, exact target binding or privilege model changed, update/re-review first.

## Fail-closed invariants

- No caller-supplied `signature_verified` is authority.
- Exact VERIFIED v3 Owner command required for unlock and grant creation.
- Owner command must bind `TRANSPORT_PROOF_SINGLE_REQUEST`, exact `https://example.com/`, max one request, bounded unlock <=120 seconds, and general Production network false.
- No `anon`, `authenticated`, or `PUBLIC` EXECUTE on Mission #18 mutation functions.
- No credentials, downloads, code execution, external side effects, protected-data egress, or cross-client context.
- `production_network_enabled` remains false throughout the proof mission.
- Request policy: `FAIL_CLOSED_CONSUME_ON_RESERVATION_NO_AUTORELEASE`.
- A failed DNS/TLS/timeout/network attempt still consumes the one request slot; retry requires new review and fresh Owner approval/reset.
- Approval endpoint itself never unlocks, creates grant, enables proof lane, or enables network.
- Proof executor is separate from the general executor.
- Shadow/readiness evidence never counts as Owner authority or real network proof.
- No fallback target, aliases, wildcards, caller-supplied target URLs, or cross-host redirects.

## Current known live blockers (must be re-read, never assumed)

- Stabilization Exit Gate
- Post-freeze apply/deploy of reviewed control-plane + proof artifact
- Fresh cryptographic Owner Passkey command after technical readiness
- First real bounded request to generate runtime transport evidence

This branch is preparation only. Production activation remains evidence-gated.
