# Mission #18 — Controlled Proof Target Binding (PREP ONLY)

Status: DO NOT APPLY OR DEPLOY DURING FEATURE FREEZE.

## Canonical proof target

The exact cryptographically bound target for the first real proof is:

`https://example.com/`

This must remain identical across the Owner command, proof lane, bounded grant, reservation/finalize logic, executor, readiness checks, and audit evidence. No alias, wildcard, caller-selected target, or fallback target is allowed.

## Runtime behavior

1. Resolve `example.com` immediately before connect and require all resolved IPs to pass the public-IP guard.
2. Re-resolve/revalidate at connect time to protect against DNS rebinding.
3. Establish TLS with hostname verification for `example.com` while pinning the selected public IP.
4. Allow HTTPS redirects only when the redirect remains on the same host; maximum 3 redirects.
5. Re-run live authority/window checks and DNS/IP validation before every redirected connect.
6. A redirect is not required for success. If no redirect occurs, redirect-policy evidence must record that zero redirects were observed and no cross-host/non-HTTPS redirect was followed.
7. Enforce total request timeout <=10 seconds and response body <=1 MiB.
8. No credentials, client data, protected data, download, code execution, or external side effects.
9. Reservation occurs atomically before any DNS/network side effect and is never auto-released after acquisition.
10. General `production_network_enabled` remains false for the entire proof-only mission.

## Mandatory exact-binding checks before any real proof

Re-review and require exact agreement across:
- `pm_internet_transport_proof_lane_v1.fixed_target_url`
- Owner Passkey canonical payload `transport_proof_target_url`
- Owner command intent `TRANSPORT_PROOF_SINGLE_REQUEST`
- `pm_internet_transport_proof_activation_gate_v1`
- verified-command helper exact-target comparison
- bounded grant `allowed_resources.fixed_target_url`
- atomic reservation exact-target check
- proof executor `TARGET`
- artifact attestation/hash and review record
- verification tests and Mission Control readiness display

## Safety gate

Fresh Owner Passkey is requested only after Stabilization Exit, all six technical implementation gaps are complete, contract/authority/concurrency/recovery checks pass, and readiness reports `owner_action_required_now=true`.

The approval must bind exactly one request to `https://example.com/`, bounded unlock <=120 seconds, grant <=10 minutes, `PUBLIC_READ`, `PAOJAI_OPERATIONS_AI`, `can_delegate=false`, and `general_production_network_authorized=false`.
