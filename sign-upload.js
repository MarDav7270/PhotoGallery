import { requireAdmin, cloudinarySignature } from "../lib/auth.js";
export default function handler(req,res){
  if(!requireAdmin(req,res)) return;
  if(req.method!=="POST") return res.status(405).end();
  const slug=String(req.body?.slug||"");
  if(!/^[a-z0-9-]{3,70}$/.test(slug)) return res.status(400).json({error:"Invalid gallery."});
  const timestamp=Math.floor(Date.now()/1000);
  const folder=`client-galleries/${slug}`;
  const params={folder,timestamp};
  return res.status(200).json({timestamp,folder,signature:cloudinarySignature(params),apiKey:process.env.CLOUDINARY_API_KEY,cloudName:process.env.CLOUDINARY_CLOUD_NAME});
}