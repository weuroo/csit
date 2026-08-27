export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','no-referrer');
  if(req.method!=='POST') return res.status(405).json({ok:false,error:'METHOD_NOT_ALLOWED'});
  const code=String(req.body?.code||'');
  const state=String(req.body?.state||'');
  if(!code||!state) return res.status(400).json({ok:false,error:'INVALID_EXCHANGE'});
  try{
    const r=await fetch('https://bvnmwfhqgdevupvcqqyl.supabase.co/functions/v1/pm-owner-mission-auth',{
      method:'POST',
      headers:{'content-type':'application/json','origin':'https://paojai-mission-control-hub.vercel.app','accept':'application/json'},
      body:JSON.stringify({action:'exchange',code,state}),
      cache:'no-store'
    });
    const d=await r.json().catch(()=>({}));
    if(!r.ok||d?.ok===false||!d?.sessionToken) return res.status(r.status||403).json({ok:false,error:d?.error||'OWNER_SESSION_EXCHANGE_FAILED'});
    res.setHeader('Set-Cookie',`pm_owner_mission_session=${encodeURIComponent(d.sessionToken)}; Path=/; Max-Age=28800; HttpOnly; Secure; SameSite=Lax`);
    return res.status(200).json({ok:true,expiresAt:d.expiresAt,scope:d.scope});
  }catch(e){
    console.error('INTERNET_LIVE_AUTH_EXCHANGE_FAILED',e instanceof Error?e.message:String(e));
    return res.status(502).json({ok:false,error:'INTERNET_LIVE_AUTH_EXCHANGE_FAILED'});
  }
}
