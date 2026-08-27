# Mission #18 — Controlled Internet Fast Path (PREP ONLY)

Status: PRE-STAGED / DO NOT MERGE OR DEPLOY DURING FEATURE FREEZE

Goal: minimize elapsed time from Stabilization Exit to the first verified real HTTPS read while preserving Owner Security Root and fail-closed controls.

Canonical proof target:
`https://example.com/`

## Mandatory sequence

1. Confirm Stabilization Exit and all safety regressions pass.
2. Re-read current Operating Manual + live schema; rebase/update this package if state changed.
3. Resolve Owner crypto binding BEFORE any transport authority work: review/apply the crypto-bound gateway v2 package, require independently derived consumed WebAuthn evidence, deploy/review Owner approval Edge v5+ that never sends caller-supplied `signature_verified`, and require `pm_owner_gateway_crypto_binding_readiness_v1()` or its reviewed successor to pass.
4. Confirm the Production proof lane remains hard-bound to exact `https://example.com/`; no PM-owned redirect target, alias, wildcard, fallback, or caller-selected URL is allowed.
5. Apply the reviewed schema-bound SQL package implementing only:
   - `pm_internet_transport_proof_bounded_unlock_v1`
   - `pm_internet_create_command_bound_pilot_grant_v1`
   - `pm_internet_transport_proof_reserve_request_v1`
   - `pm_internet_transport_proof_finalize_request_v1`
6. Apply/review `crypto_bound_command_helper_patch.sql.disabled` so the transport helper accepts ONLY `CRYPTO_BOUND_GATEWAY_V2` commands and `ALLOW_CRYPTO_BOUND_V2` audits; legacy v1 gateway audits must never satisfy the proof path.
7. Run canonical-name readiness + cross-binding verification.
8. Require implementation contract validation + authority-surface regression.
9. Promote only an attested proof executor artifact to `APPROVED_FOR_PILOT`; no general production network authority.
10. Deploy a separate proof-only executor fixed to exact `https://example.com/`, one request maximum.
11. Run the runtime concurrency harness as soon as Production atomic reservation exists; require exactly one winner and zero DNS/network side effect during the harness.
12. Only after technical implementation is complete, Owner crypto-binding readiness passes, and all required gates pass, request fresh Owner Passkey approval using exact v3-or-later intent.
13. Phase A: bounded Owner Lockdown release, scope `TRANSPORT_PROOF_SINGLE_REQUEST`, <=120 seconds, general production network remains false.
14. Phase B: create exact-command-bound <=10-minute `PAOJAI_OPERATIONS_AI` / `PUBLIC_READ` grant.
15. Atomically reserve the one request slot before DNS or any network side effect.
16. Execute pinned-IP TLS proof to exact `https://example.com/`; same-host HTTPS redirects only if observed, max 3, timeout <=10s, response <=1 MiB.
17. Collect direct DNS connect-time evidence and redirect revalidation evidence for every redirect actually followed; zero redirects must be recorded explicitly rather than fabricated as redirect evidence.
18. Immediately finalize idempotently, relock, revoke/expire grant, then run Central/Action/Guardian + Authority + Contract + Concurrency/Failure Policy + Recovery/Kill-Switch checks.
19. Complete only if Production evidence has exactly one consumed request, `network_request_performed=true`, a valid bounded response, DNS/redirect policy evidence passed, no Critical regression, zero active PAOJAI PUBLIC_READ grants, Owner Lockdown restored, general Production network false, and Recovery/Kill-Switch verified.

## Crypto-binding activation order

The crypto-prep artifacts are intentionally disabled. Activation order after live Stabilization Exit review:

1. `owner_gateway_crypto_binding_patch.sql.disabled` — create service-role-only gateway v2 with no caller signature boolean.
2. Apply all hardening findings in `crypto_binding_review_2026-08-28.md`: require exact trusted credential, persisted `evidence.verified=true`, consumed evidence, freshness, exact owner/device/nonce/payload hash/intent/origin/RP binding.
3. `approval_edge_v5_crypto_bound.ts.disabled` — server-side WebAuthn verification and authority handoff only to gateway v2; approval-only, no grant/unlock/lane/network mutation.
4. `schema_bound_candidate.sql.disabled` — technical transport controls after crypto binding is safe.
5. `crypto_bound_command_helper_patch.sql.disabled` — force all transport controls to accept only the crypto-bound v2 audit semantics.
6. Re-run Owner crypto-binding readiness, contract validation, Authority Surface, Central/Action/Guardian, concurrency/failure-policy and Recovery/Kill-Switch before Owner Passkey is surfaced.

## Merge / activation gate

This PR MUST remain draft and unmerged while Feature Freeze is active. After Stabilization Exit it still MUST NOT be merged/applied blindly. Before merge/apply, re-check current Manual + Production schema and require current live safety evidence. If any contract, schema, artifact hash, Owner-security requirement, exact target binding or privilege model changed, update/re-review first.

## Fail-closed invariants

- No caller-supplied `signature_verified` is authority.
- Exact VERIFIED v3-or-later Owner command required for unlock and grant creation.
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
- Legacy gateway v1 audit semantics are never accepted as proof authority for Mission #18.

## Current known live blockers (must be re-read, never assumed)

- Stabilization Exit Gate
- Owner command gateway crypto-binding remediation (`CALLER_ASSERTED_SIGNATURE_VERIFICATION_STILL_TRUSTED` in current Production readiness)
- Post-freeze apply/deploy of reviewed control-plane + proof artifact
- Fresh cryptographic Owner Passkey command only after technical readiness
- First real bounded request to generate runtime transport evidence

This branch is preparation only. Production activation remains evidence-gated.
