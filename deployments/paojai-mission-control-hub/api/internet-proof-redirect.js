// PREVIEW VALIDATION ONLY DURING FEATURE FREEZE.
// No client data, no credentials, no side effects, no authority mutation.
export default function handler(req,res){
  if(req.method!=='GET'){
    res.setHeader('Allow','GET');
    return res.status(405).json({ok:false,error:'METHOD_NOT_ALLOWED'});
  }
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','no-referrer');
  res.setHeader('Location','/api/internet-proof-final');
  return res.status(302).end();
}
