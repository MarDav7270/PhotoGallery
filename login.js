import { makeToken, cookieName, cloudinaryReady } from "../lib/auth.js";
export default function handler(req,res) {
  if (req.method !== "POST") return res.status(405).end();
  if (!cloudinaryReady()) return res.status(500).json({error:"Server setup is incomplete. Check Vercel environment variables."});
  const { password } = req.body || {};
  if (!password || password !== process.env.ADMIN_PASSWORD) return res.status(401).json({error:"Incorrect password."});
  res.setHeader("Set-Cookie", `${cookieName}=${makeToken()}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800`);
  return res.status(200).json({ok:true});
}