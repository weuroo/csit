# Mission #18 — DNS Side-Effect Accounting Review — 2026-08-29

Status: **PROMOTION BLOCKER / PREP ONLY**

## Finding
After a successful atomic one-request reservation, the current proof executor calls `stablePublicDns(current.hostname)` before setting `networkPerformed=true`.

DNS resolution is itself external network activity. If DNS fails, times out, or is blocked before the HTTPS socket is opened, the proof attempt has already caused a DNS/network side effect while failure evidence can still report `network_request_performed=false`.

That is not acceptable for Mission #18 because the one-request slot is fail-closed/consume-on-reservation and all post-reservation network activity must be truthfully audited.

## Required remediation before promotion
1. Keep atomic reservation before all DNS/network activity.
2. Immediately after the reservation is proven to be the sole allowed winner, set the persisted/runtime network-attempt marker **before the first DNS lookup**.
3. Treat DNS failure after reservation as a failed proof attempt with the slot consumed; never auto-release or retry.
4. Finalize FAILED evidence with `network_request_performed=true` when any DNS query was attempted.
5. If finalize fails, emergency relock remains mandatory and must verify cleanup.
6. Do not weaken pinned-IP, same-host redirect, timeout, response-size, Owner-command, nonce, grant, Lockdown, or general-network=false gates.

## Guard
`dns_side_effect_accounting_static_check.mjs.disabled` blocks promotion until the executor marks network activity before `stablePublicDns(...)` and retains consumed-slot/fresh-Owner-review semantics.

No Production authority, grant, unlock, DNS query, or external proof request is created by this review or guard.
