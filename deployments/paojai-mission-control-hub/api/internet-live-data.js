function cookie(req,name){const raw=String(req.headers.cookie||'');for(const part of raw.split(';')){const i=part.indexOf('=');if(i<0)continue;const k=part.slice(0,i).trim();if(k===name)return decodeURIComponent(part.slice(i+1).trim())}return ''}
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','no-referrer');
  if(req.method!=='GET') return res.status(405).json({ok:false,error:'METHOD_NOT_ALLOWED'});
  let auth=String(req.headers.authorization||'');
  if(!auth.toLowerCase().startsWith('bearer ')){
    const t=cookie(req,'pm_owner_mission_session');
    if(t) auth='Bearer '+t;
  }
  if(!auth.toLowerCase().startsWith('bearer ')) return res.status(401).json({ok:false,error:'OWNER_SESSION_REQUIRED'});
  const ac=new AbortController();
  const timer=setTimeout(()=>ac.abort(),4500);
  try{
    const r=await fetch('https://bvnmwfhqgdevupvcqqyl.supabase.co/functions/v1/pm-internet-mission-live-data',{
      method:'GET',
      headers:{authorization:auth,'accept':'application/json'},
      cache:'no-store',
      signal:ac.signal
    });
    const text=await r.text();
    res.status(r.status);
    res.setHeader('Content-Type',r.headers.get('content-type')||'application/json; charset=utf-8');
    return res.send(text);
  }catch(e){
    const timedOut=e && (e.name==='AbortError'||String(e).includes('aborted'));
    console.error(timedOut?'INTERNET_LIVE_PROXY_TIMEOUT':'INTERNET_LIVE_PROXY_FAILED',e instanceof Error?e.message:String(e));
    return res.status(timedOut?504:502).json({ok:false,error:timedOut?'INTERNET_LIVE_PROXY_TIMEOUT':'INTERNET_LIVE_PROXY_FAILED'});
  }finally{
    clearTimeout(timer);
  }
}
