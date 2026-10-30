import { requireAdmin, cloudinarySignature } from "../lib/auth.js";
export default async function handler(req,res){
  if(!requireAdmin(req,res)) return;
  if(req.method!=="POST") return res.status(405).end();
  const publicId=String(req.body?.publicId||"");
  if(!publicId.startsWith("client-galleries/")) return res.status(400).json({error:"Invalid photo."});
  try{
    const timestamp=Math.floor(Date.now()/1000);
    const params={public_id:publicId,timestamp};
    const body=new URLSearchParams({...params,api_key:process.env.CLOUDINARY_API_KEY,signature:cloudinarySignature(params)});
    const r=await fetch(`https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/destroy`,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body});
    const data=await r.json();
    if(!r.ok||data.result!=="ok") throw new Error(data.error?.message||"Could not delete photo.");
    return res.status(200).json({ok:true});
  }catch(e){return res.status(500).json({error:e.message});}
}
