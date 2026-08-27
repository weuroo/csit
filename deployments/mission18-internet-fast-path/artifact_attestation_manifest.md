# Mission #18 — Artifact Attestation Manifest (PREP ONLY)

Status: DO NOT DEPLOY / DO NOT PROMOTE DURING FEATURE FREEZE.

Canonical proof target:
`https://paojai-mission-control-hub.vercel.app/api/internet-proof-redirect`

Canonical final path:
`/api/internet-proof-final`

## Reviewed source identities

These are Git blob identities for the reviewed prep sources. They are NOT substitutes for the final deploy artifact SHA-256. After materialization, compute SHA-256 from the exact deploy bytes and attest that value separately.

| Artifact | Prep source | Git blob | Intended destination | Runtime gate |
|---|---|---|---|---|
| Proof executor | `proof_executor_candidate.ts.disabled` | `a4b823d3efc5f5b6c6bed90523973d175e36e74f` | Supabase Edge Function `pm-controlled-internet-executor-proof/index.ts` | `verify_jwt=true`; post-Stabilization only |
| Redirect target | `proof_target_redirect.js.disabled` | `5ff62c9479f97c992046e984c204dccb8c0597b1` | Mission Control Hub `/api/internet-proof-redirect` | additive route; canonical Production origin only |
| Final target | `proof_target_final.js.disabled` | `2bd498c3d4c1dae31577fc03a14f132116eb6ca9` | Mission Control Hub `/api/internet-proof-final` | additive route; canonical Production origin only |

## Mandatory post-Exit materialization sequence

1. Re-read current Operating Manual and live Production schema.
2. Confirm this PR head is current with master and still contains only reviewed Mission #18 prep changes.
3. Verify the three Git blob identities above still match. If any source changed, this manifest is stale and review restarts.
4. Materialize `.disabled` files into deployment locations without overwriting an existing route/artifact unless explicit Owner approval authorizes replacement.
5. Run static validation on exact materialized bytes (`deno check` for executor; syntax/build check for Vercel target files).
6. Compute SHA-256 of exact executor deploy bytes; record function slug/version/hash in `pm_internet_executor_release_artifact_attestation_v1` only after review.
7. Deploy deterministic PM-owned target routes first. Verify canonical Production origin returns exact 302 same-host redirect then 200 final response. Preview origin is not evidence.
8. Apply reviewed SQL/control-plane migration only after Stabilization Exit and current safety checks.
9. Run cross-binding + negative-drift + authority + contract + concurrency checks.
10. Request Fresh Owner Passkey only after technical readiness is true and every exact target binding agrees.
11. Proof executor remains one-request only; general `production_network_enabled` remains false.
12. After the attempt, finalize, relock, revoke/expire, and run post-proof regressions.

## Fail-closed attestation rules

- Git blob identity proves reviewed source identity only; it does not prove deployed bytes.
- Final source SHA-256 must be calculated after materialization and before deployment/promotion.
- Artifact hash mismatch = BLOCK.
- Function slug/version mismatch = BLOCK.
- `verify_jwt=false` on proof executor = BLOCK.
- Any fallback to `example.com` = BLOCK.
- Any caller-selected target = BLOCK.
- Preview/Vercel branch URL = not Owner authority and not Production proof.
- Any requirement to set general `production_network_enabled=true` = design violation and BLOCK.
