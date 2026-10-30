import { requireAdmin, cloudinaryAuth } from "../lib/auth.js";
export default async function handler(req,res) {
  if (!requireAdmin(req,res)) return;
  if (req.method !== "GET") return res.status(405).end();
  try {
    const cloud = process.env.CLOUDINARY_CLOUD_NAME;
    const url = `https://api.cloudinary.com/v1_1/${cloud}/folders/client-galleries`;
    const r = await fetch(url,{headers:{Authorization:cloudinaryAuth()}});
    const data = await r.json();
    if (!r.ok) throw new Error(data.error?.message || "Could not load galleries.");
    return res.status(200).json({folders:(data.folders||[]).map(f=>({name:f.name,path:f.path}))});
  } catch(e) { return res.status(500).json({error:e.message}); }
}