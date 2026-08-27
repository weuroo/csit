# Mission #18 — Controlled Proof Target Binding (PREP ONLY)

Status: DO NOT APPLY OR DEPLOY DURING FEATURE FREEZE.

## Finding

The current candidate/activation path is hard-bound to `https://example.com/`. That target is unsuitable for a deterministic operational proof because PM does not control its redirect behavior. The first proof also needs direct redirect revalidation evidence without fabricating a redirect.

## Replacement target after Stabilization Exit

Canonical target should be PM-owned and deterministic on the Mission Control Hub production origin:

`https://paojai-mission-control-hub.vercel.app/api/internet-proof-redirect`

Expected behavior:
1. GET `/api/internet-proof-redirect` -> `302 Location: /api/internet-proof-final`
2. Same host, HTTPS only.
3. Executor must re-run live gates + DNS/IP guard before the second connect.
4. GET `/api/internet-proof-final` -> `200` small JSON response.
5. No credentials, no client data, no protected data, no state mutation, no external side effect.

## Mandatory binding changes before any real proof

Re-review and update all exact target comparisons atomically; never change only one layer:
- `pm_internet_transport_proof_lane_v1.fixed_target_url`
- Owner Passkey canonical payload `transport_proof_target_url`
- `pm_internet_transport_proof_activation_gate_v1`
- `pm_internet_assert_verified_transport_command_v1`
- bounded grant `allowed_resources.fixed_target_url`
- atomic reservation exact target check
- proof executor `TARGET`
- artifact attestation/hash and review record
- verification tests and Mission Control readiness display

## Safety gate

Target migration is NOT authority expansion. Nevertheless, it MUST be treated as a reviewed post-freeze migration because it changes cryptographically bound Owner intent and transport policy. Fresh Owner Passkey must be generated only after the final target is deployed, verified public, and all bindings agree exactly.

Do not accept aliases, wildcards, caller-supplied URLs, query-controlled redirects, cross-host redirects, or fallback to `example.com` after the migration.
