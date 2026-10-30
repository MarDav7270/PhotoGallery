import { listAll, signedGet } from "../lib/r2.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();
  const slug = String(req.query.slug || "");
  if (!/^[a-z0-9-]{3,70}$/.test(slug)) return res.status(400).json({ error: "Invalid gallery link." });
  try {
    const allObjects = await listAll(`client-galleries/${slug}/`);
    const keys = new Set(allObjects.map(x => x.Key));
    const originals = allObjects.filter(x =>
      x.Key && !x.Key.endsWith("/.gallery.json") && !x.Key.endsWith(".preview.jpg") && x.Size > 0
    );
    const photos = await Promise.all(originals.map(async x => {
      const key = x.Key;
      const filename = key.split("/").pop() || "photo.jpg";
      const previewKey = `${key}.preview.jpg`;
      return {
        url: await signedGet(key),
        previewUrl: keys.has(previewKey) ? await signedGet(previewKey) : await signedGet(key),
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
