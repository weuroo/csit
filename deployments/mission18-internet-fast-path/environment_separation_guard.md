# Mission #18 — Environment Separation Guard

Status: PRE-STAGED / FEATURE FREEZE SAFE DOCUMENTATION ONLY.

## Observed state

GitHub/Vercel integration can create Preview deployments from the Mission #18 prep branch for existing Vercel projects. Preview readiness is NOT Production readiness and MUST NOT count as Internet proof, Owner authority, or Stabilization Exit evidence.

## Mandatory rules

1. Never use a Vercel preview hostname as WebAuthn RP/origin for Sovereign Owner approval.
2. Never bind a signed Owner command to a preview hostname.
3. Never count a preview HTTP response as `network_request_performed=true` Production evidence.
4. Mission #18 canonical proof target is external and exact: `https://example.com/`.
5. Owner Passkey/WebAuthn remains bound to the approved Production Mission Control origin; this authentication origin is not the proof target.
6. Do not create or deploy PM-owned proof redirect/final routes for Mission #18; doing so would drift from the exact target contract.
7. Preview deployments may be used only for static/code-shape review that does not exercise Production authority, Production service-role mutations, Owner Passkey approval, or real proof-lane consumption.
8. Artifact attestation must bind the exact Production proof-executor artifact hash/version and exact `https://example.com/` target; Preview hashes do not promote automatically.
9. If Vercel auto-builds the prep branch, that does not authorize merge, promote, alias, Production deployment, Owner approval, or proof execution.

## Fail-closed interpretation

Preview READY != Production READY.
Preview URL reachable != Production proof.
Preview deployment != Owner authorization.
No human should be asked to Face ID/Passkey against a preview origin.
No PM-owned URL may substitute for exact `https://example.com/` in Mission #18.
