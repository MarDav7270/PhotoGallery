import crypto from "node:crypto";
const COOKIE = "timeless_admin";
function sign(value) {
  return crypto.createHmac("sha256", process.env.SESSION_SECRET || "").update(value).digest("hex");
}
export function makeToken() {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + 1000 * 60 * 60 * 24 * 7 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}
export function validToken(req) {
  const raw = req.headers.cookie || "";
  const token = raw.split(";").map(v => v.trim()).find(v => v.startsWith(COOKIE + "="))?.slice(COOKIE.length + 1);
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  const expected = sign(payload);
  try {
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;
    return JSON.parse(Buffer.from(payload, "base64url").toString()).exp > Date.now();
  } catch { return false; }
}
export function requireAdmin(req, res) {
  if (!validToken(req)) { res.status(401).json({ error: "Please sign in again." }); return false; }
  return true;
}
export const cookieName = COOKIE;
export function storageReady() {
  return ["R2_ACCOUNT_ID","R2_ACCESS_KEY_ID","R2_SECRET_ACCESS_KEY","R2_BUCKET_NAME","SESSION_SECRET","ADMIN_PASSWORD"].every(k => !!process.env[k]);
}
export function slugify(s) {
  return s.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,45);
}
