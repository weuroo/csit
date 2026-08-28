# Mission #18 — Pinned-IP Runtime Evidence Review

Status: CRITICAL PREP BLOCKER / FEATURE-FREEZE SAFE REVIEW ONLY
Date: 2026-08-28

## Finding

The current disabled proof executor supplies a validated IP through the Node HTTPS `lookup` callback, but its evidence path marks the network leg from a generic socket `connect` event and does not independently prove that `socket.remoteAddress` equals the selected validated/pinned IP. It also does not persist the validated DNS answer set for each transport leg.

That is insufficient for the Mission #18 completion contract, which requires Production runtime evidence that the HTTPS proof used a pinned public IP and that DNS / redirect revalidation passed. A boolean such as `dns_connect_time_verified=true` cannot by itself prove which DNS answers were observed or which address the socket actually reached.

## Required remediation before promotion

1. Capture the validated DNS A/AAAA answer set for every leg after the two-read stability check.
2. Persist the exact selected/pinned IP and address family for that leg.
3. On the connected socket, capture `remoteAddress` / `remoteFamily` and fail closed unless the canonicalized remote address equals the exact selected pinned IP.
4. Do not set connect-time verification true merely because a socket emitted `connect`; verification requires the remote-address equality check.
5. For each redirect actually followed, repeat DNS stability validation, selected-IP binding, and actual remote-address verification and persist evidence per leg.
6. Zero redirects remain valid; record `redirect_observed=false` rather than inventing redirect evidence.
7. Finalize must persist this server-derived runtime evidence; caller-supplied DNS/IP evidence must never be accepted.
8. Attestation/promotion must run `pinned_ip_runtime_evidence_static_check.mjs.disabled` against the exact materialized executor bytes and block on any failure.

## Authority impact

None. This review and checker only reduce acceptable promotion surface. They do not unlock Owner Lockdown, create a grant, enable the proof lane, enable general Production network, consume a request slot, perform DNS, or perform any external network request.

## Current disposition

FAIL CLOSED. The existing disabled executor candidate must not be promoted until this requirement is implemented and re-reviewed after Stabilization Exit.
