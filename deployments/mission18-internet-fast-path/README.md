# Mission #18 — Controlled Internet Fast Path (PREP ONLY)

Status: PRE-STAGED / DO NOT MERGE OR DEPLOY DURING FEATURE FREEZE

Goal: minimize elapsed time from Stabilization Exit to the first verified real HTTPS read while preserving Owner Security Root and fail-closed controls.

Canonical proof target:
`https://example.com/`

## Mandatory sequence

1. Confirm Stabilization Exit and all safety regressions pass.
2. Re-read current Operating Manual + live schema; rebase/update this package if state changed.
3. Resolve Owner crypto binding BEFORE any transport authority work: review/apply the crypto-bound gateway v2 package, require independently derived consumed WebAuthn evidence, deploy/review Owner approval Edge v5+ that never sends caller-supplied `signature_verified`, and require reviewed crypto/exact-payload readiness to pass.
4. Confirm the Production proof lane remains hard-bound to exact `https://example.com/`; no PM-owned redirect target, alias, wildcard, fallback, or caller-selected URL is allowed.
5. Apply the reviewed schema-bound SQL package implementing only:
   - `pm_internet_transport_proof_bounded_unlock_v1`
   - `pm_internet_create_command_bound_pilot_grant_v1`
   - `pm_internet_transport_proof_reserve_request_v1`
   - `pm_internet_transport_proof_finalize_request_v1`
6. Immediately apply/review `reservation_replay_guard.sql.disabled` over the base reservation function BEFORE any executor or concurrency harness can run. The authoritative reservation response contract is: first winner = `ok=true`, `duplicate=false`, `slot_consumed=true`, `network_execution_allowed=true`; any consumed-token replay = `ok=false`, `duplicate=true`, `network_execution_allowed=false`; cross-command token reuse fails closed. Run `reservation_replay_static_check.mjs.disabled` against the final reservation function source and executor. A base `schema_bound_candidate.sql.disabled` reservation response by itself is NOT activation-ready.
7. Apply/review `crypto_bound_command_helper_patch.sql.disabled` so the transport helper accepts ONLY `CRYPTO_BOUND_GATEWAY_V2` commands and `ALLOW_CRYPTO_BOUND_V2` audits; legacy v1 gateway audits must never satisfy the proof path.
8. Run canonical-name readiness + cross-binding verification.
9. Require implementation contract validation + authority-surface regression.
10. Promote only an attested proof executor artifact to `APPROVED_FOR_PILOT`; no general production network authority.
11. Before deployment, run static validators including `predeploy_static_validation.mjs.disabled`, `executor_runtime_authority_static_check.mjs.disabled`, and `reservation_replay_static_check.mjs.disabled`. The executor must re-assert persisted VERIFIED Owner command + consumed nonce/gateway audit before every material transport leg and reject unless exactly one active PAOJAI `PUBLIC_READ` grant exists globally, bound to the exact command, LOW risk, non-delegable, <=10 minutes, within unlock expiry, with the exact safe resource scope.
12. Deploy a separate proof-only executor fixed to exact `https://example.com/`, one request maximum.
13. As soon as Production atomic reservation exists, apply/review `runtime_concurrency_support.sql.disabled`, deploy the temporary operator-authenticated `runtime_concurrency_harness.ts.disabled`, and run `runtime_concurrency_static_check.mjs.disabled` before execution. Runtime evidence must be SERVER-DERIVED: each simultaneous reserve call writes its own attempt row; recorder v2 accepts only `run_id` and cannot accept caller-supplied winners/losers/results/network flags. Require exactly one winner, current reservation-function SHA binding, expected atomic update shape, real proof lane pristine, Owner Lockdown true, and zero DNS/external proof-network side effect.
14. Only after technical implementation is complete, Owner crypto/exact-payload readiness passes, and all required gates pass, request fresh Owner Passkey approval using exact v3-or-later intent.
15. Phase A: bounded Owner Lockdown release, scope `TRANSPORT_PROOF_SINGLE_REQUEST`, <=120 seconds, general production network remains false.
16. Phase B: create exact-command-bound <=10-minute `PAOJAI_OPERATIONS_AI` / `PUBLIC_READ` grant.
17. Atomically reserve the one request slot before DNS or any network side effect.
18. Execute pinned-IP TLS proof to exact `https://example.com/`; same-host HTTPS redirects only if observed, max 3, timeout <=10s, response <=1 MiB.
19. Collect direct DNS connect-time evidence and redirect revalidation evidence for every redirect actually followed; zero redirects must be recorded explicitly rather than fabricated as redirect evidence.
20. Immediately finalize idempotently, relock, revoke/expire grant, then run Central/Action/Guardian + Authority + Contract + Concurrency/Failure Policy + Recovery/Kill-Switch checks.
21. Complete only if Production evidence has exactly one consumed request, `network_request_performed=true`, a valid bounded response, DNS/redirect policy evidence passed, no Critical regression, zero active PAOJAI PUBLIC_READ grants, Owner Lockdown restored, general Production network false, and Recovery/Kill-Switch verified.

## Crypto-binding activation order

The crypto-prep artifacts are intentionally disabled. Activation order after live Stabilization Exit review:

1. `owner_gateway_crypto_binding_patch.sql.disabled` — create service-role-only gateway v2 with no caller signature boolean.
2. Apply all hardening findings in `crypto_binding_review_2026-08-28.md`: require exact trusted credential, persisted `evidence.verified=true`, consumed evidence, freshness, exact owner/device/nonce/payload hash/intent/origin/RP binding.
3. `approval_edge_v5_crypto_bound.ts.disabled` — server-side WebAuthn verification and authority handoff only to gateway v2; approval-only, no grant/unlock/lane/network mutation.
4. `owner_gateway_exact_payload_binding_readiness.sql.disabled` — verify the actual gateway mismatch/reason checks rather than brittle equality-source strings; all canonical payload/resource scope authority fields must be independently enforced.
5. `schema_bound_candidate.sql.disabled` — base technical transport controls after crypto binding is safe.
6. `reservation_replay_guard.sql.disabled` — mandatory replacement of the base reservation function; establishes the executor-compatible first-winner/replay response contract and fail-closed replay behavior. Do not proceed if its static checker fails.
7. `crypto_bound_command_helper_patch.sql.disabled` — force all transport controls to accept only crypto-bound v2 audit semantics.
8. Re-run Owner crypto/exact-payload readiness, contract validation, Authority Surface, Central/Action/Guardian, reservation replay, concurrency/failure-policy and Recovery/Kill-Switch before Owner Passkey is surfaced.

## Merge / activation gate

This PR MUST remain draft and unmerged while Feature Freeze is active. After Stabilization Exit it still MUST NOT be merged/applied blindly. Before merge/apply, re-check current Manual + Production schema and require current live safety evidence. If any contract, schema, artifact hash, Owner-security requirement, exact target binding or privilege model changed, update/re-review first.

## Fail-closed invariants

- No caller-supplied `signature_verified` is authority.
- Exact VERIFIED v3-or-later Owner command required for unlock and grant creation, and executor re-validates persisted command authority before every material network leg.
- Owner command must bind `TRANSPORT_PROOF_SINGLE_REQUEST`, exact `https://example.com/`, max one request, bounded unlock <=120 seconds, and general Production network false.
- Exactly one active PAOJAI `PUBLIC_READ` grant may exist at proof time; any extra or broader active grant blocks transport.
- No `anon`, `authenticated`, or `PUBLIC` EXECUTE on Mission #18 mutation functions.
- No credentials, downloads, code execution, external side effects, protected-data egress, or cross-client context.
- `production_network_enabled` remains false throughout the proof mission.
- Request policy: `FAIL_CLOSED_CONSUME_ON_RESERVATION_NO_AUTORELEASE`.
- The final promoted reservation function must return `network_execution_allowed=true` only for the sole first atomic winner and false for every replay/loser. Any contract mismatch with the executor is a promotion blocker.
- A failed DNS/TLS/timeout/network attempt still consumes the one request slot; retry requires new review and fresh Owner approval/reset.
- Approval endpoint itself never unlocks, creates grant, enables proof lane, or enables network.
- Proof executor is separate from the general executor.
- Runtime concurrency evidence must be server-derived from attempt rows; a caller-supplied result JSON or network boolean can never close the concurrency gate.
- Concurrency evidence is stale immediately if the Production reservation-function SHA changes.
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
