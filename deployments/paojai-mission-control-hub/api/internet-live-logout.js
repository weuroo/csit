export default function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  if(req.method!=='POST') return res.status(405).json({ok:false,error:'METHOD_NOT_ALLOWED'});
  res.setHeader('Set-Cookie','pm_owner_mission_session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax');
  return res.status(200).json({ok:true});
}
