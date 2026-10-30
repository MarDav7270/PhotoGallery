import { requireAdmin } from "../lib/auth.js";
import { listAll } from "../lib/r2.js";

export default async function handler(req, res) {
  if (!requireAdmin(req, res)) return;
  if (req.method !== "GET") return res.status(405).end();
  try {
    const prefixes = await listAll("client-galleries/", "/");
    const folders = prefixes.map(x => {
      const name = (x.Prefix || "").replace(/^client-galleries\//, "").replace(/\/$/, "");
      return { name, path: x.Prefix };
    }).filter(x => /^[a-z0-9-]{3,70}$/.test(x.name));
    return res.status(200).json({ folders });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Could not load galleries." });
  }
}
