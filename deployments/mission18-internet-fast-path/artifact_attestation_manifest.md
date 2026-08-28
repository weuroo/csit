# Mission #18 — Artifact Attestation Manifest (PREP ONLY)

Status: DO NOT DEPLOY / DO NOT PROMOTE DURING FEATURE FREEZE.

Canonical proof target: `https://example.com/`

## Reviewed source identity

Git blob identity proves reviewed prep source identity only. It is NOT a substitute for final deploy-byte SHA-256.

| Artifact | Prep source | Current reviewed Git blob | Intended destination | Runtime gate |
|---|---|---|---|---|
| Proof-only executor | `proof_executor_candidate.ts.disabled` | `0fc5a1c88ec20d7897e0c0dd4f478a9a1c65df61` | Supabase Edge Function `pm-controlled-internet-executor-proof/index.ts` | `verify_jwt=true` + fresh operator/service-only `PM_PROOF_EXECUTOR_TOKEN`; post-Stabilization only |

The reviewed source records actual TCP-connect evidence separately from reservation/socket allocation, prefers validated IPv4 with validated IPv6 fallback, does not fabricate redirect-connect evidence when zero redirects occur, and now rejects ordinary authenticated callers even though the artifact uses service-role internally.

No PM-owned redirect/final route is part of the canonical proof. The executor is hard-bound to `https://example.com/`; same-host HTTPS redirects are permitted up to 3 if observed, but zero redirects are valid and must be recorded honestly.

## Mandatory post-Exit materialization sequence

1. Re-read current Operating Manual and live Production schema.
2. Confirm this PR remains draft/unmerged until verified Stabilization Exit.
3. Confirm the reviewed executor Git blob above still matches. If source changed, refresh this manifest and review again.
4. Materialize the `.disabled` executor into a separate proof-only Edge Function `pm-controlled-internet-executor-proof`; do not overwrite the existing general executor.
5. Deploy with `verify_jwt=true` AND a fresh >=32-byte `PM_PROOF_EXECUTOR_TOKEN` available only to the controlled operator/service invocation path; never expose it to browser/client code.
6. Run static/type validation on exact materialized bytes, then compute SHA-256 of exact deploy bytes.
7. Record a dedicated Production attestation row `CONTROLLED_INTERNET_EXECUTOR_PROOF` binding exact function slug/version/deploy SHA-256, `APPROVED_FOR_PILOT`, and network compile-time enablement only for this proof artifact.
8. Preserve the existing general executor/candidate as non-proof authority; do not turn general Production network on.
9. Apply reviewed six-part control-plane implementation only after Stabilization Exit, with validation after each material change.
10. Run cross-binding, negative-drift, contract, authority, Central/Action/Guardian, concurrency/failure-policy, and Recovery/Kill-Switch checks.
11. Run runtime concurrency harness as soon as Production atomic reservation exists; require exactly one winner and zero DNS/network side effect in that test.
12. Request fresh Owner Passkey only after all six implementation gaps are closed, contract/authority/concurrency gates pass, and readiness reports `owner_action_required_now=true`.
13. Exact Owner command must bind `TRANSPORT_PROOF_SINGLE_REQUEST`, `https://example.com/`, max one request, bounded unlock <=120s, grant <=10m, `PUBLIC_READ`, and general Production network false.
14. After reservation, no automatic retry. Failed proof consumes the slot and requires fresh review/Owner approval.
15. After the one proof attempt, immediately remove/rotate `PM_PROOF_EXECUTOR_TOKEN`, finalize idempotently, relock, revoke/expire, and run full post-proof regressions.

## Fail-closed attestation rules

- Artifact hash mismatch = BLOCK.
- Function slug/version mismatch = BLOCK.
- `verify_jwt=false` on proof executor = BLOCK.
- Missing/weak (`<32` bytes) proof-executor operator secret = BLOCK.
- Any browser/client-visible proof-executor secret = BLOCK.
- Any target other than exact `https://example.com/` = BLOCK.
- Any caller-selected target = BLOCK.
- Any caller-supplied `signature_verified` accepted as authority = BLOCK.
- Any approval endpoint that creates a grant, releases Lockdown, enables the proof lane, or enables network = BLOCK.
- Any requirement to set general `production_network_enabled=true` = BLOCK.
- Any reservation auto-release after a failed attempt = BLOCK.
- Any claimed redirect-connect evidence when `redirect_observed=false` = BLOCK.
- Any `network_request_performed=true` without an actual transport connect signal = BLOCK.
