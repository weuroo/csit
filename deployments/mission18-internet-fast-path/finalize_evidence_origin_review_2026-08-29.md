# Mission #18 — Finalize Evidence Origin Review — 2026-08-29

Status: **CRITICAL PRE-PROMOTION BLOCKER / PREP ONLY**

No Production authority change is authorized by this document. Keep PR #8 draft/unmerged during Feature Freeze.

## Finding

`pm_internet_transport_proof_finalize_request_v1` currently accepts `p_evidence jsonb` and derives SUCCESS from caller-provided fields including network/DNS/redirect/response-bound facts. The proof-only executor is intended to supply those values, but the database contract itself does not prove that the values originated from the promoted/attested executor.

Because Mission #18 mutation RPCs are executable by `service_role`, any other service-role execution context capable of calling finalize could potentially submit fabricated success evidence for a consumed request token. Attesting the executor artifact alone does not close this gap if finalize cannot distinguish the attested executor from another service-role caller.

This violates the evidence-before-assumption requirement for the first real Internet proof: `proof_completed=true` must not be achievable solely from caller assertions.

## Required fail-closed remediation before promotion

The final Production design must make proof success server-derived and exact-reservation-bound. At minimum:

1. The atomic reservation creates or binds a unique evidence session for the exact request token and Owner command.
2. The promoted proof-only executor is bound to that session through an independently verifiable executor/artifact identity, not a caller boolean.
3. A one-time finalize capability/nonce is bound to that reservation and executor identity. Arbitrary service-role callers must not be able to mint or reuse it.
4. Runtime transport facts needed for success — DNS answer set, selected/pinned IP, actual remote IP, redirect legs, request-performed state, status, bytes and elapsed time — are persisted into a server-side evidence ledger bound to the exact reservation.
5. `pm_internet_transport_proof_finalize_request_v1` derives SUCCESS from the persisted bound evidence record. Caller JSON may contain supplemental diagnostics but must not be authoritative for success.
6. Finalize is idempotent, consumes its finalize capability once, never releases the request slot, and cannot change a failed/consumed attempt back into an executable slot.
7. Any ambiguity, missing ledger row, attestation mismatch, nonce mismatch/replay, malformed evidence, or executor identity mismatch fails closed, immediately relocks/revokes, and requires fresh review + fresh Owner approval for another attempt.
8. The post-proof verification must independently verify the ledger provenance and exact executor/artifact binding before accepting `proof_completed=true`.

## Promotion gate

Run `finalize_evidence_origin_static_check.mjs.disabled` against the final SQL + executor + attestation artifacts. Promotion must remain blocked while caller-provided `p_evidence` fields can directly drive SUCCESS or while the server-derived evidence/executor/reservation/one-time-finalize bindings are absent.

This check is additive to, not a replacement for, Owner crypto binding, exact-payload binding, Authority Surface, Central/Action/Guardian, reservation replay, runtime concurrency, DNS/pinned-IP evidence, Recovery/Kill-Switch and post-proof relock verification.

## Current decision

**FAIL CLOSED. Do not promote or request Owner Passkey yet.**
