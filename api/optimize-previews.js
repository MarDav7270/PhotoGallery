import { requireAdmin } from "../lib/auth.js";
import { r2Client, bucketName, listAll } from "../lib/r2.js";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";

export default async function handler(req, res) {
  if (!requireAdmin(req, res)) return;
  if (req.method !== "POST") return res.status(405).end();

  const slug = String(req.body?.slug || "");
  if (!/^[a-z0-9-]{3,70}$/.test(slug)) {
    return res.status(400).json({ error: "Invalid gallery." });
  }

  try {
    const prefix = `client-galleries/${slug}/`;
    const objects = await listAll(prefix);
    const keys = new Set(objects.map(x => x.Key));
    const originals = objects.filter(x =>
      x.Key && x.Size > 0 &&
      !x.Key.endsWith(".preview.jpg") &&
      !x.Key.endsWith(".preview.webp") &&
      !x.Key.endsWith("/.gallery.json")
    );
    const next = originals.find(x => !keys.has(`${x.Key}.preview.webp`));

    if (!next) {
      return res.status(200).json({ processed: 0, done: true });
    }

    const client = r2Client();
    const bucket = bucketName();
    const object = await client.send(new GetObjectCommand({ Bucket: bucket, Key: next.Key }));
    const input = await object.Body.transformToByteArray();
    const preview = await sharp(Buffer.from(input), { limitInputPixels: 100_000_000 })
      .rotate()
      .resize({ width: 1100, height: 1100, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 62, effort: 4 })
      .toBuffer();

    await client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: `${next.Key}.preview.webp`,
      Body: preview,
      ContentType: "image/webp",
      CacheControl: "public, max-age=31536000, immutable"
    }));

    return res.status(200).json({
      processed: 1,
      done: false,
      filename: next.Key.split("/").pop(),
      previewBytes: preview.length
    });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Could not optimize this photo." });
  }
}
