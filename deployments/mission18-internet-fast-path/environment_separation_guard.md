# Mission #18 — Environment Separation Guard

Status: PRE-STAGED / FEATURE FREEZE SAFE DOCUMENTATION ONLY.

## Observed state

GitHub/Vercel integration creates Preview deployments from the Mission #18 prep branch for existing Vercel projects. Preview readiness is NOT Production readiness and MUST NOT count as Internet proof, Owner authority, or Stabilization Exit evidence.

## Mandatory rules

1. Never use a Vercel preview hostname as WebAuthn RP/origin for Sovereign Owner approval.
2. Never bind a signed Owner command to a preview hostname.
3. Never count a preview HTTP response as `network_request_performed=true` Production evidence.
4. Canonical proof target is the Production Mission Control origin only after reviewed post-freeze deployment:
   `https://paojai-mission-control-hub.vercel.app/api/internet-proof-redirect`
5. The proof target route must not be exposed on Production until Stabilization Exit + reviewed deploy gate.
6. Preview deployments may be used only for static/code-shape review that does not exercise Production authority, Production service-role mutations, Owner Passkey approval, or real proof-lane consumption.
7. Artifact attestation must bind the exact Production artifact hash/version and canonical Production origin; Preview hashes do not promote automatically.
8. If Vercel auto-builds the prep branch, that does not authorize merge, promote, alias, or Production deployment.

## Fail-closed interpretation

Preview READY != Production READY.
Preview URL reachable != Production proof.
Preview deployment != Owner authorization.
No human should be asked to Face ID/Passkey against a preview origin.
