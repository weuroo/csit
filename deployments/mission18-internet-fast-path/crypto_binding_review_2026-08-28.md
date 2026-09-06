# Mission #18 Crypto-Binding Review — 2026-08-28

PREP ONLY — no Production activation during Feature Freeze.

## Live evidence reviewed

- `pm_owner_command_gateway_v1` still accepts caller-supplied `p_signature_verified boolean` and therefore cannot be accepted as Mission #18 cryptographic authority.
- `pm_finalize_owner_passkey_stepup_v1` is service-role-only and marks the consumed challenge row with `evidence.verified=true` and `evidence.consumed_at` after the approval Edge has performed server-side WebAuthn verification.
- Current approval Edge is `pm-owner-internet-pilot-approval-shadow` v4. It performs `verifyAuthenticationResponse(...)` server-side, then calls the step-up finalize RPC, but still routes command authority through gateway v1 using `p_signature_verified:true`.
- Production remains contained: Owner Lockdown=true, general Production network=false, proof lane disabled, network request count=0, active PAOJAI PUBLIC_READ grants=0.

## Required v2 gateway evidence checks before activation

The staged `pm_owner_command_gateway_v2` must not accept `used_at IS NOT NULL` alone as proof. Before activation, review/patch it to require all of the following from the exact consumed step-up row:

1. `s.credential_id = trusted_device.credential_id`.
2. `s.evidence->>'verified' = 'true'`.
3. `s.evidence->>'consumed_at'` is present and corresponds to `s.used_at`.
4. `s.used_at <= s.expires_at`.
5. `s.used_at` is fresh and immediately precedes command issuance (bounded window; recommended <=30 seconds).
6. Exact owner, device, nonce, payload hash, purpose, origin and RP ID match.
7. Exact Mission #18 intent binding matches: `TRANSPORT_PROOF_SINGLE_REQUEST`, target `https://example.com/`, max one request, lockdown release <=120 seconds, general Production network=false.
8. The command record is still `UNVERIFIED`, unexpired, and has `signature_algorithm='WEBAUTHN_ASSERTION_VERIFIED_SERVER_SIDE'`.
9. Nonce is unconsumed before the gateway transaction and is consumed atomically by exactly one allowed gateway decision.
10. Only service_role may execute the v2 gateway; anon/authenticated/public must have no execute privilege.

## Approval Edge v5 candidate

`approval_edge_v5_crypto_bound.ts.disabled` is staged to preserve the current v4 WebAuthn verification sequence while changing only the authority handoff:

- perform WebAuthn verification server-side;
- consume/finalize the exact step-up challenge;
- insert the exact intent-bound signed command as `UNVERIFIED`;
- call only `pm_owner_command_gateway_v2(command_id, source_component)`;
- never send caller-supplied `signature_verified` to any authority function;
- promote command to `VERIFIED` only if v2 returns `allowed=true`, `nonce_consumed=true`, `crypto_bound=true`;
- never create a grant, unlock Owner Lockdown, enable proof lane, or enable network.

## Activation gate

Do not request Owner Passkey until:

- Feature Freeze has exited based on live Production evidence;
- the v2 gateway passes crypto-binding readiness;
- all six technical implementation gaps are complete;
- contract validation, authority surface, Central/Action/Guardian, concurrency/failure-policy, and Recovery/Kill-Switch checks pass;
- runtime concurrency harness proves exactly one reservation winner with zero DNS/network side effect.
