export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','no-referrer');
  if(req.method!=='GET') return res.status(405).json({ok:false,error:'METHOD_NOT_ALLOWED'});
  const auth=String(req.headers.authorization||'');
  if(!auth.toLowerCase().startsWith('bearer ')) return res.status(401).json({ok:false,error:'OWNER_SESSION_REQUIRED'});
  try{
    const r=await fetch('https://bvnmwfhqgdevupvcqqyl.supabase.co/functions/v1/pm-internet-mission-live-data',{
      method:'GET',
      headers:{authorization:auth,'accept':'application/json'},
      cache:'no-store'
    });
    const text=await r.text();
    res.status(r.status);
    res.setHeader('Content-Type',r.headers.get('content-type')||'application/json; charset=utf-8');
    return res.send(text);
  }catch(e){
    console.error('INTERNET_LIVE_PROXY_FAILED',e instanceof Error?e.message:String(e));
    return res.status(502).json({ok:false,error:'INTERNET_LIVE_PROXY_FAILED'});
  }
}
