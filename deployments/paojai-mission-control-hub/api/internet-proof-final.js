// PREVIEW VALIDATION ONLY DURING FEATURE FREEZE.
// No client data, no credentials, no side effects, no authority mutation.
export default function handler(req,res){
  if(req.method!=='GET'){
    res.setHeader('Allow','GET');
    return res.status(405).json({ok:false,error:'METHOD_NOT_ALLOWED'});
  }
  res.setHeader('Cache-Control','no-store');
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','no-referrer');
  return res.status(200).json({ok:true,proofTarget:'PM_CONTROLLED_INTERNET_TRANSPORT_V1',sideEffects:false,clientData:false,environment:'PREVIEW_VALIDATION'});
}
