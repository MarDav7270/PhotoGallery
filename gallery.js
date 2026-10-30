import { cloudinaryAuth } from "../lib/auth.js";
export default async function handler(req,res) {
  if(req.method!=="GET") return res.status(405).end();
  const slug=String(req.query.slug||"");
  if(!/^[a-z0-9-]{3,70}$/.test(slug)) return res.status(400).json({error:"Invalid gallery link."});
  try{
    const cloud=process.env.CLOUDINARY_CLOUD_NAME;
    const prefix=encodeURIComponent(`client-galleries/${slug}/`);
    const r=await fetch(`https://api.cloudinary.com/v1_1/${cloud}/resources/image/upload?prefix=${prefix}&max_results=500`,{headers:{Authorization:cloudinaryAuth()}});
    const data=await r.json();
    if(!r.ok) throw new Error(data.error?.message||"Could not load this gallery.");
    const photos=(data.resources||[]).map(x=>({url:x.secure_url,publicId:x.public_id,width:x.width,height:x.height,format:x.format,createdAt:x.created_at}));
    return res.status(200).json({photos});
  }catch(e){return res.status(500).json({error:e.message});}
}