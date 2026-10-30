import { requireAdmin } from "../lib/auth.js";
import { listAll, signedGet } from "../lib/r2.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();
  const slug = String(req.query.slug || "");
  if (!/^[a-z0-9-]{3,70}$/.test(slug)) return res.status(400).json({ error: "Invalid gallery link." });
  try {
    const objects = (await listAll(`client-galleries/${slug}/`)).filter(x => x.Key && !x.Key.endsWith("/.gallery.json") && x.Size > 0);
    const photos = await Promise.all(objects.map(async x => {
      const key = x.Key;
      const filename = key.split("/").pop() || "photo.jpg";
      return {
        url: await signedGet(key),
        downloadUrl: await signedGet(key, filename),
        publicId: key, key, width: null, height: null, format: "jpg",
        createdAt: x.LastModified?.toISOString?.() || null
      };
    }));
    return res.status(200).json({ photos });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Could not load this gallery." });
  }
}
