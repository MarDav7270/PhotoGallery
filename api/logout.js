import { cookieName } from "../lib/auth.js";
export default function handler(req,res) {
  res.setHeader("Set-Cookie", `${cookieName}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`);
  return res.status(200).json({ok:true});
}
