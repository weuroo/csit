import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const sb = createClient(SUPABASE_URL, SERVICE_ROLE);
const MAX_BODY = 2_000_000;
const MAX_CLOCK_SKEW_SECONDS = 300;
const CAP = "COMPUTER_OPERATOR_PRODUCTION_V1";
const CANDIDATE_SCOPE = "COMPUTER_PRODUCTION_CANDIDATE_ENROLL";
const CANDIDATE_VERSION = "1.0.0-production-candidate";

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

const reply = (status: number, body: Record<string, unknown>) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" },
});

function b64uDecode(s: string): Uint8Array {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}
function canonical(value: Json): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  const obj = value as Record<string, Json>;
  return "{" + Object.keys(obj).sort().map((k) => JSON.stringify(k) + ":" + canonical(obj[k])).join(",") + "}";
}
async function sha256HexText(text: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function sha256HexBytes(bytes: Uint8Array): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function verifyEd25519(pub: Uint8Array, sig: Uint8Array, msg: Uint8Array): Promise<boolean> {
  try {
    const key = await crypto.subtle.importKey("raw", pub, { name: "Ed25519" }, false, ["verify"]);
    return await crypto.subtle.verify({ name: "Ed25519" }, key, sig, msg);
  } catch { return false; }
}
async function audit(deviceKey: string | null, eventType: string, gateResult: string, evidence: Record<string, unknown>) {
  await sb.from("pm_computer_action_audit_shadow_v1").insert({
    request_key: deviceKey ? `COMPUTER_OPERATOR_PRODUCTION_V1:${deviceKey}` : null,
    device_key: deviceKey, event_type: eventType, gate_result: gateResult, evidence,
  });
}
function safeResults(results: unknown): unknown[] | null {
  if (!Array.isArray(results) || results.length < 1 || results.length > 12) return null;
  return results.map((r: any) => {
    const d = r?.data && typeof r.data === "object" ? r.data : {};
    return {
      command_id: String(r?.command_id ?? "").slice(0, 120),
      type: String(r?.type ?? "").slice(0, 40),
      ok: r?.ok === true,
      error: r?.ok === true ? undefined : String(r?.error ?? "COMMAND_FAILED").slice(0, 200),
      data: {
        foreground_window_title: typeof d.foreground_window_title === "string" ? d.foreground_window_title.slice(0, 180) : undefined,
        content_type: d.content_type === "image/png" ? "image/png" : undefined,
        width: Number.isFinite(Number(d.width)) ? Number(d.width) : undefined,
        height: Number.isFinite(Number(d.height)) ? Number(d.height) : undefined,
        sha256: typeof d.sha256 === "string" ? d.sha256.slice(0, 64) : undefined,
        char_count: Number.isFinite(Number(d.char_count)) ? Number(d.char_count) : undefined,
        raw_screen_bytes_stored: false,
      },
    };
  });
}

Deno.serve(async (req: Request) => {
  if (!SUPABASE_URL || !SERVICE_ROLE) return reply(503, { ok: false, code: "SERVER_NOT_CONFIGURED" });
  if (req.method !== "POST") return reply(405, { ok: false, code: "POST_ONLY" });
  const declared = Number(req.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > MAX_BODY) return reply(413, { ok: false, code: "BODY_TOO_LARGE" });
  const raw = await req.text();
  if (!raw || raw.length > MAX_BODY) return reply(413, { ok: false, code: "INVALID_BODY_SIZE" });

  let env: any;
  try { env = JSON.parse(raw); } catch { return reply(400, { ok: false, code: "INVALID_JSON" }); }
  const p = env?.payload;
  const sigText = env?.signature_ed25519;
  if (!p || typeof p !== "object" || typeof sigText !== "string") return reply(400, { ok: false, code: "INVALID_ENVELOPE" });
  if (p.schema !== "PAOJAI_COMPUTER_OPERATOR_PRODUCTION_CLIENT_V1" || p.mode !== "PRODUCTION_CANDIDATE") return reply(400, { ok: false, code: "WRONG_SCHEMA_OR_MODE" });
  if (p.persistent_execution_authority !== false || p.persistent_sensor_authority !== false || p.shell_access !== false || p.file_write !== false || p.clipboard_access !== false || p.network_discovery !== false || p.high_impact_allowed !== false) return reply(403, { ok: false, code: "CLIENT_BOUNDARY_VIOLATION" });
  if (!Array.isArray(p.capabilities) || p.capabilities.length !== 1 || p.capabilities[0] !== CAP) return reply(403, { ok: false, code: "CAPABILITY_NOT_ALLOWED" });

  const deviceKey = typeof p.device_key === "string" ? p.device_key : "";
  const pubText = typeof p.device_public_key_ed25519 === "string" ? p.device_public_key_ed25519 : "";
  const nonce = typeof p.nonce === "string" ? p.nonce : "";
  const action = typeof p.action === "string" ? p.action : "";
  const issued = Number(p.issued_at_unix);
  if (!deviceKey || !pubText || !nonce || !action || !Number.isFinite(issued)) return reply(400, { ok: false, code: "MISSING_IDENTITY_OR_ACTION" });
  if (Math.abs(Math.floor(Date.now() / 1000) - issued) > MAX_CLOCK_SKEW_SECONDS) return reply(408, { ok: false, code: "STALE_REQUEST" });

  let pub: Uint8Array, sig: Uint8Array;
  try { pub = b64uDecode(pubText); sig = b64uDecode(sigText); } catch { return reply(400, { ok: false, code: "INVALID_BASE64URL" }); }
  if (pub.length !== 32 || sig.length !== 64) return reply(400, { ok: false, code: "INVALID_ED25519_LENGTH" });
  const derived = "computer_" + (await sha256HexBytes(pub)).slice(0, 32);
  if (derived !== deviceKey) return reply(403, { ok: false, code: "DEVICE_KEY_MISMATCH" });
  if (!(await verifyEd25519(pub, sig, new TextEncoder().encode(canonical(p as Json))))) {
    await audit(deviceKey, "COMPUTER_OPERATOR_CANDIDATE_REQUEST_REJECTED", "FAIL_CLOSED", { reason: "SIGNATURE_INVALID", action });
    return reply(403, { ok: false, code: "SIGNATURE_INVALID" });
  }

  const { error: nonceErr } = await sb.from("pm_computer_device_nonces_shadow_v1").insert({ device_key: deviceKey, nonce, issued_at_unix: issued });
  if (nonceErr) {
    if ((nonceErr as any).code === "23505") {
      await audit(deviceKey, "COMPUTER_OPERATOR_CANDIDATE_REQUEST_REJECTED", "REPLAY_BLOCKED", { action, nonce_hash: await sha256HexText(nonce) });
      return reply(409, { ok: false, code: "REPLAY_REJECTED" });
    }
    return reply(503, { ok: false, code: "NONCE_LEDGER_FAILED" });
  }

  const { data: existing, error: lookupErr } = await sb.from("pm_computer_device_registry_v1")
    .select("device_key,device_crypto_identity,owner_binding_state,trust_state,execution_authority,sensor_authority,revoked_at,agent_version,last_seen_at")
    .eq("device_key", deviceKey).maybeSingle();
  if (lookupErr) return reply(503, { ok: false, code: "DEVICE_LOOKUP_FAILED" });

  if (!existing) {
    if (action !== "poll") return reply(403, { ok: false, code: "CANDIDATE_NOT_ENROLLED" });
    const token = req.headers.get("x-pm-computer-candidate-enrollment") ?? "";
    if (token.length < 32 || token.length > 512) return reply(401, { ok: false, code: "CANDIDATE_ENROLLMENT_REQUIRED" });
    const tokenHash = await sha256HexText(token);
    const now = new Date().toISOString();
    const { data: auth } = await sb.from("pm_computer_enrollment_authorizations_v1")
      .select("authorization_id,owner_user_id,device_label,evidence")
      .eq("token_hash", tokenHash).eq("scope", CANDIDATE_SCOPE)
      .is("used_at", null).is("revoked_at", null).gt("expires_at", now).limit(1).maybeSingle();
    if (!auth || auth.evidence?.expected_agent_version !== CANDIDATE_VERSION) {
      await audit(deviceKey, "COMPUTER_OPERATOR_CANDIDATE_ENROLLMENT_REJECTED", "FAIL_CLOSED", { reason: "NO_VALID_ONE_TIME_AUTHORIZATION" });
      return reply(401, { ok: false, code: "CANDIDATE_ENROLLMENT_INVALID" });
    }
    const { error: insErr } = await sb.from("pm_computer_device_registry_v1").insert({
      device_key: deviceKey,
      display_name: auth.device_label ?? "Owner Computer — Operator Candidate",
      platform: "Windows amd64",
      agent_version: CANDIDATE_VERSION,
      device_crypto_identity: { algorithm: "Ed25519", public_key_ed25519: pubText, candidate_schema: p.schema },
      owner_binding_state: "PENDING", trust_state: "QUARANTINED_SHADOW", execution_authority: false, sensor_authority: false,
      last_seen_at: now,
      metadata: { source: "SIGNED_PRODUCTION_CANDIDATE_HEARTBEAT", candidate_enrollment_authorization_id: auth.authorization_id, production_authority_granted: false },
    });
    if (insErr) return reply(503, { ok: false, code: "CANDIDATE_DEVICE_INSERT_FAILED" });
    await sb.from("pm_computer_enrollment_authorizations_v1").update({ used_at: now }).eq("authorization_id", auth.authorization_id).is("used_at", null);
    await audit(deviceKey, "COMPUTER_OPERATOR_CANDIDATE_ENROLLED", "PENDING_OWNER_BIND", { agent_version: CANDIDATE_VERSION, execution_authority: false, sensor_authority: false, token_reusable: false });
    return reply(423, { ok: false, code: "OWNER_BIND_REQUIRED", device_key: deviceKey, owner_binding_state: "PENDING", execution_authority: false });
  }

  if (existing.revoked_at || existing.trust_state === "REVOKED" || existing.owner_binding_state === "REVOKED") return reply(403, { ok: false, code: "DEVICE_REVOKED" });
  if (existing.device_crypto_identity?.public_key_ed25519 !== pubText) return reply(403, { ok: false, code: "REGISTERED_KEY_MISMATCH" });
  if (String(p.agent_version ?? "") !== CANDIDATE_VERSION) return reply(409, { ok: false, code: "AGENT_VERSION_MISMATCH" });

  const now = new Date().toISOString();
  await sb.from("pm_computer_device_registry_v1").update({ last_seen_at: now, updated_at: now, agent_version: CANDIDATE_VERSION }).eq("device_key", deviceKey);
  if (existing.owner_binding_state !== "VERIFIED") return reply(423, { ok: false, code: "OWNER_BIND_REQUIRED", device_key: deviceKey, execution_authority: false });
  if (existing.execution_authority !== true) return reply(423, { ok: false, code: "PRODUCTION_RELEASE_REQUIRED", device_key: deviceKey, execution_authority: false });

  try {
    if (action === "poll") {
      let { data: s } = await sb.from("pm_computer_operator_prod_sessions_v1")
        .select("session_id,state,expires_at").eq("device_key", deviceKey).eq("state", "CLAIMED").gt("expires_at", now)
        .order("claimed_at", { ascending: false }).limit(1).maybeSingle();
      if (!s) {
        const { data: claim } = await sb.rpc("pm_claim_computer_operator_prod_session_v1", { p_device_key: deviceKey });
        if (claim?.allowed !== true) return reply(200, { ok: true, code: "WATCHING_NO_AUTHORIZED_SESSION" });
      }
      const { data: lease, error: leaseErr } = await sb.rpc("pm_issue_computer_operator_prod_lease_v1", { p_device_key: deviceKey });
      if (leaseErr) return reply(500, { ok: false, code: "LEASE_RPC_FAILED" });
      if (lease?.allowed !== true) return reply(200, { ok: true, code: lease?.reason ?? "WATCHING_NO_WORK" });
      return reply(200, { ok: true, code: "LEASE_ISSUED", lease: {
        lease_id: lease.lease_id, lease_nonce: lease.lease_nonce, expires_at: lease.expires_at,
        capability: CAP, production_execution: true,
        allowed_window_titles: lease.allowed_window_titles, allow_real_desktop: true, allow_real_app: true,
        allow_screen: lease.allow_screen, allow_mouse: lease.allow_mouse, allow_keyboard: lease.allow_keyboard,
        high_impact_allowed: false, persistent_execution_authority: false, persistent_sensor_authority: false, commands: lease.commands,
      }});
    }
    if (action === "complete") {
      const sanitized = safeResults(p.results);
      if (!sanitized) return reply(400, { ok: false, code: "RESULTS_INVALID" });
      const { data, error } = await sb.rpc("pm_complete_computer_operator_prod_v1", {
        p_device_key: deviceKey, p_lease_id: String(p.lease_id ?? ""), p_lease_nonce: String(p.lease_nonce ?? ""), p_results: sanitized,
      });
      if (error || data?.accepted !== true) return reply(403, { ok: false, code: data?.reason ?? "COMPLETION_REJECTED" });
      await audit(deviceKey, "COMPUTER_OPERATOR_PRODUCTION_LEASE_COMPLETED", "EXECUTION_ONLY_NOT_OUTCOME_VERIFIED", { lease_id: String(p.lease_id ?? ""), result_count: sanitized.length, raw_screen_bytes_stored: false, semantic_outcome_verified: false });
      return reply(200, { ok: true, code: "COMPLETED_EXECUTION_ONLY", semantic_outcome_verified: false });
    }
    if (action === "abort") {
      const { data, error } = await sb.rpc("pm_abort_computer_operator_prod_v1", { p_device_key: deviceKey, p_lease_id: String(p.lease_id ?? ""), p_reason: String(p.reason ?? "CLIENT_ABORT").slice(0, 180) });
      if (error) return reply(500, { ok: false, code: "ABORT_FAILED" });
      return reply(200, { ok: true, code: "ABORTED_FAIL_CLOSED", ...data });
    }
    return reply(403, { ok: false, code: "ACTION_NOT_ALLOWED" });
  } catch (e) {
    await audit(deviceKey, "COMPUTER_OPERATOR_PRODUCTION_RUNTIME_ERROR", "FAIL_CLOSED", { action, error: String(e).slice(0, 240) });
    return reply(500, { ok: false, code: "RUNTIME_FAILED" });
  }
});
