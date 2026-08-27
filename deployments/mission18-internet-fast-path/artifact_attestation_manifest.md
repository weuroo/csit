# Mission #18 — Artifact Attestation Manifest (PREP ONLY)

Status: DO NOT DEPLOY / DO NOT PROMOTE DURING FEATURE FREEZE.

Canonical proof target: `https://example.com/`

## Reviewed source identity

Git blob identity proves reviewed prep source identity only. It is NOT a substitute for final deploy-byte SHA-256.

| Artifact | Prep source | Current reviewed Git blob | Intended destination | Runtime gate |
|---|---|---|---|---|
| Proof-only executor | `proof_executor_candidate.ts.disabled` | `97e709bcb48eafeca1a2e7cb3fc50ce3690f0781` | Supabase Edge Function `pm-controlled-internet-executor-proof/index.ts` | `verify_jwt=true`; post-Stabilization only |

The reviewed source now records actual TCP-connect evidence separately from reservation/socket allocation, prefers validated IPv4 with validated IPv6 fallback, and does not fabricate redirect-connect evidence when zero redirects occur.

No PM-owned redirect/final route is part of the canonical proof. The executor is hard-bound to `https://example.com/`; same-host HTTPS redirects are permitted up to 3 if observed, but zero redirects are valid and must be recorded honestly.

## Mandatory post-Exit materialization sequence

1. Re-read current Operating Manual and live Production schema.
2. Confirm this PR remains draft/unmerged until verified Stabilization Exit.
3. Confirm the reviewed executor Git blob above still matches. If source changed, refresh this manifest and review again.
4. Materialize the `.disabled` executor into a separate proof-only Edge Function `pm-controlled-internet-executor-proof`; do not overwrite the existing general executor.
5. Deploy with `verify_jwt=true`, run static/type validation on exact materialized bytes, then compute SHA-256 of exact deploy bytes.
6. Record a dedicated Production attestation row `CONTROLLED_INTERNET_EXECUTOR_PROOF` binding exact function slug/version/deploy SHA-256, `APPROVED_FOR_PILOT`, and network compile-time enablement only for this proof artifact.
7. Preserve the existing general executor/candidate as non-proof authority; do not turn general Production network on.
8. Apply reviewed six-part control-plane implementation only after Stabilization Exit, with validation after each material change.
9. Run cross-binding, negative-drift, contract, authority, Central/Action/Guardian, concurrency/failure-policy, and Recovery/Kill-Switch checks.
10. Run runtime concurrency harness as soon as Production atomic reservation exists; require exactly one winner and zero DNS/network side effect in that test.
11. Request fresh Owner Passkey only after all six implementation gaps are closed, contract/authority/concurrency gates pass, and readiness reports `owner_action_required_now=true`.
12. Exact Owner command must bind `TRANSPORT_PROOF_SINGLE_REQUEST`, `https://example.com/`, max one request, bounded unlock <=120s, grant <=10m, `PUBLIC_READ`, and general Production network false.
13. After reservation, no automatic retry. Failed proof consumes the slot and requires fresh review/Owner approval.
14. After proof attempt, finalize idempotently, relock, revoke/expire, and run full post-proof regressions.

## Fail-closed attestation rules

- Artifact hash mismatch = BLOCK.
- Function slug/version mismatch = BLOCK.
- `verify_jwt=false` on proof executor = BLOCK.
- Any target other than exact `https://example.com/` = BLOCK.
- Any caller-selected target = BLOCK.
- Any caller-supplied `signature_verified` accepted as authority = BLOCK.
- Any approval endpoint that creates a grant, releases Lockdown, enables the proof lane, or enables network = BLOCK.
- Any requirement to set general `production_network_enabled=true` = BLOCK.
- Any reservation auto-release after a failed attempt = BLOCK.
- Any claimed redirect-connect evidence when `redirect_observed=false` = BLOCK.
- Any `network_request_performed=true` without an actual transport connect signal = BLOCK.
