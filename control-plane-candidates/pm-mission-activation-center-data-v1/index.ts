import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import postgres from "npm:postgres";

const enc = new TextEncoder();
const ORIGIN = 'https://paojai-mission-control-hub.vercel.app';
const H = {
  'access-control-allow-origin': ORIGIN,
  'access-control-allow-methods': 'GET,OPTIONS',
  'access-control-allow-headers': 'authorization,content-type',
  'cache-control': 'no-store',
  'content-type': 'application/json; charset=utf-8',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
  'vary': 'origin'
};

async function sha256(s:string){
  const h=await crypto.subtle.digest('SHA-256',enc.encode(s));
  return [...new Uint8Array(h)].map(x=>x.toString(16).padStart(2,'0')).join('');
}

Deno.serve(async(req:Request)=>{
  const origin=req.headers.get('origin')||'';
  if(origin && origin!==ORIGIN) return new Response(JSON.stringify({ok:false,error:'ORIGIN_NOT_ALLOWED'}),{status:403,headers:H});
  if(req.method==='OPTIONS') return new Response(null,{status:204,headers:H});
  if(req.method!=='GET') return new Response(JSON.stringify({ok:false,error:'METHOD_NOT_ALLOWED'}),{status:405,headers:H});
  const auth=req.headers.get('authorization')||'';
  if(!auth.toLowerCase().startsWith('bearer ')) return new Response(JSON.stringify({ok:false,error:'OWNER_SESSION_REQUIRED'}),{status:401,headers:H});
  const raw=auth.slice(7).trim();
  if(!raw) return new Response(JSON.stringify({ok:false,error:'OWNER_SESSION_REQUIRED'}),{status:401,headers:H});

  let sql:any=null;
  try{
    sql=postgres(Deno.env.get('SUPABASE_DB_URL')||'',{ssl:'require',max:2,connect_timeout:8,idle_timeout:2});
    const tokenHash=await sha256(raw);
    const ss=await sql`
      select session_id
      from public.pm_owner_mission_sessions_v1
      where token_hash=${tokenHash}
        and scope='READ_ONLY_MISSION_CONTROL'
        and origin=${ORIGIN}
        and expires_at>now()
        and revoked_at is null
      limit 1`;
    if(!ss[0]) return new Response(JSON.stringify({ok:false,error:'OWNER_SESSION_INVALID_OR_EXPIRED'}),{status:401,headers:H});
    await sql`update public.pm_owner_mission_sessions_v1 set last_used_at=now() where session_id=${ss[0].session_id}`;

    const [missions,summary,outputs]=await Promise.all([
      sql`select mission_key,title,risk_class,mission_status,outcome_decision,operational_state,usable_now_within_scope,production_live,human_approval_required_for_next_activation,activation_blocker,next_best_action,truth_boundary,evidence_checked_at from public.pm_mission_activation_center_v1 order by mission_id`,
      sql`select operational_state,mission_count,usable_now_count,production_live_count,approval_required_count,latest_evidence_checked_at from public.pm_mission_activation_summary_v1 order by operational_state`,
      sql`select mission_key,title,operational_state,path,file_kind,content_md5,executable,deployment_allowed,truth_boundary,reuse_policy,deployment_still_gated,evidence_checked_at from public.pm_reusable_mission_outputs_v1 order by mission_key`
    ]);

    const totals={
      total:missions.length,
      usable:missions.filter((m:any)=>m.usable_now_within_scope===true).length,
      approval_required:missions.filter((m:any)=>m.human_approval_required_for_next_activation===true).length,
      production_live:missions.filter((m:any)=>m.production_live===true).length
    };

    return new Response(JSON.stringify({
      ok:true,
      server_time:new Date().toISOString(),
      summary:totals,
      state_summary:summary,
      missions,
      reusable_outputs:outputs,
      read_only:true,
      auth_mode:'OWNER_PASSKEY_SESSION',
      authority_effect:false,
      production_action_allowed:false
    }),{headers:H});
  }catch(e){
    console.error('MISSION_ACTIVATION_CENTER_DATA_FAILED',e instanceof Error?e.message:String(e));
    return new Response(JSON.stringify({ok:false,error:'MISSION_ACTIVATION_CENTER_DATA_FAILED'}),{status:500,headers:H});
  }finally{
    try{if(sql)await sql.end({timeout:1})}catch{}
  }
});
