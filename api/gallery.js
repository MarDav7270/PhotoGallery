import { listAll, signedGet } from "../lib/r2.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();
  const slug = String(req.query.slug || "");
  if (!/^[a-z0-9-]{3,70}$/.test(slug)) return res.status(400).json({ error: "Invalid gallery link." });
  try {
    const objects = await listAll(`client-galleries/${slug}/`);
    const keys = new Set(objects.map(x => x.Key));
    const originals = objects.filter(x =>
      x.Key && !x.Key.endsWith("/.gallery.json") &&
      !x.Key.endsWith(".preview.jpg") && !x.Key.endsWith(".preview.webp") && x.Size > 0
    );
    const photos = await Promise.all(originals.map(async x => {
      const key = x.Key;
      const filename = key.split("/").pop() || "photo.jpg";
      const webpKey = `${key}.preview.webp`;
      const oldPreviewKey = `${key}.preview.jpg`;
      const previewKey = keys.has(webpKey) ? webpKey : (keys.has(oldPreviewKey) ? oldPreviewKey : key);
      return {
        url: await signedGet(key),
        previewUrl: await signedGet(previewKey),
        downloadUrl: await signedGet(key, filename),
        key, publicId: key, format: "jpg",
        createdAt: x.LastModified?.toISOString?.() || null
      };
    }));
    return res.status(200).json({ photos });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Could not load this gallery." });
  }
}
