import { requireAdmin } from "../lib/auth.js";
import { r2Client, bucketName } from "../lib/r2.js";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

export default async function handler(req, res) {
  if (!requireAdmin(req, res)) return;
  if (req.method !== "POST") return res.status(405).end();
  const key = String(req.body?.key || req.body?.publicId || "");
  if (!/^client-galleries\/[a-z0-9-]{3,70}\/[^/]+$/.test(key) || key.endsWith(".gallery.json") || key.endsWith(".preview.jpg")) {
    return res.status(400).json({ error: "Invalid photo." });
  }
  try {
    const client = r2Client(), bucket = bucketName();
    await Promise.all([
      client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key })),
      client.send(new DeleteObjectCommand({ Bucket: bucket, Key: `${key}.preview.jpg` }))
    ]);
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Could not delete photo." });
  }
}
