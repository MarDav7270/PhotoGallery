import { requireAdmin, cloudinaryAuth, slugify } from "../lib/auth.js";
import crypto from "node:crypto";
export default async function handler(req,res) {
  if (!requireAdmin(req,res)) return;
  if (req.method !== "POST") return res.status(405).end();
  try {
    const {name,date=""}=req.body||{};
    if (!name?.trim()) return res.status(400).json({error:"Enter a client or session name."});
    const base=slugify(name);
    if (!base) return res.status(400).json({error:"Please use a name with letters or numbers."});
    const slug=`${base}-${crypto.randomBytes(4).toString("hex")}`;
    const cloud=process.env.CLOUDINARY_CLOUD_NAME;
    const folder=`client-galleries/${slug}`;
    const r=await fetch(`https://api.cloudinary.com/v1_1/${cloud}/folders/${folder}`,{method:"POST",headers:{Authorization:cloudinaryAuth()}});
    const data=await r.json();
    if(!r.ok) throw new Error(data.error?.message||"Could not create gallery folder.");
    return res.status(200).json({slug,name:name.trim(),date,url:`${req.headers["x-forwarded-proto"]||"https"}://${req.headers.host}/g/${slug}`});
  } catch(e){return res.status(500).json({error:e.message});}
}
