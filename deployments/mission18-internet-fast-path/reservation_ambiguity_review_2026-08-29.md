# Mission #18 — Reservation Outcome Ambiguity Review

Status: **PROMOTION BLOCKER** while unresolved.

## Failure mode

The proof executor calls `pm_internet_transport_proof_reserve_request_v1` before any DNS/network activity. A distributed-systems ambiguity exists if PostgreSQL commits the reservation but the executor receives an RPC timeout/transport error or otherwise cannot decode the committed result. The current executor branch treats `re || !reservation?.ok` as a normal failure and returns without independent cleanup.

That is insufficient for `FAIL_CLOSED_CONSUME_ON_RESERVATION_NO_AUTORELEASE`: the slot may already be consumed while the bounded proof unlock, proof lane and exact command-bound grant remain active until their normal expiry. No network request should be attempted in this state, but authority must still be reduced immediately.

## Required remediation before promotion

1. Treat any reservation RPC error, missing response, malformed response, or response whose consumption state cannot be proven as `RESERVATION_OUTCOME_AMBIGUOUS`.
2. Do **not** retry reservation automatically with the same or a new token.
3. Perform no DNS lookup and no proof-network request.
4. Invoke the independent authority-reducing `pm_internet_transport_proof_emergency_relock_v1` path for the exact command.
5. Require `cleanup_verified=true` before reporting contained failure.
6. Preserve the possibility that the slot is consumed; never decrement/release/reuse it.
7. Require fresh technical review and fresh Owner approval for any later retry.
8. Persist/audit the ambiguous reservation event and cleanup result.
9. Static predeploy/promotion validation must require `reservation_ambiguity_static_check.mjs.disabled` to pass.

An explicit server response proving **non-consumption** may return as a normal reservation rejection, but any uncertain state must follow the emergency-relock path.

This review changes no Production authority and is safe preparation during Feature Freeze.
