import crypto from "node:crypto";
import { requireAdmin } from "../lib/auth.js";
import { r2Client, bucketName } from "../lib/r2.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export default async function handler(req, res) {
  if (!requireAdmin(req, res)) return;
  if (req.method !== "POST") return res.status(405).end();
  try {
    const slug = String(req.body?.slug || "");
    const filename = String(req.body?.filename || "photo.jpg");
    const size = Number(req.body?.size || 0);
    if (!/^[a-z0-9-]{3,70}$/.test(slug)) return res.status(400).json({ error: "Invalid gallery." });
    if (!/^image\/jpeg$/i.test(String(req.body?.contentType || "")) ||
        (!filename.toLowerCase().endsWith(".jpg") && !filename.toLowerCase().endsWith(".jpeg"))) {
      return res.status(400).json({ error: "Please upload JPEG photos only." });
    }
    if (!Number.isFinite(size) || size <= 0 || size > 100 * 1024 * 1024) {
      return res.status(400).json({ error: "Each JPEG must be smaller than 100 MB." });
    }
    const safeName = filename.normalize("NFKD").replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100) || "photo.jpg";
    const key = `client-galleries/${slug}/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
    const client = r2Client(), bucket = bucketName();
    const originalCommand = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: "image/jpeg" });
    const previewCommand = new PutObjectCommand({ Bucket: bucket, Key: `${key}.preview.webp`, ContentType: "image/webp" });
    const [uploadUrl, previewUploadUrl] = await Promise.all([
      getSignedUrl(client, originalCommand, { expiresIn: 900 }),
      getSignedUrl(client, previewCommand, { expiresIn: 900 })
    ]);
    return res.status(200).json({ uploadUrl, previewUploadUrl, key });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Could not prepare upload." });
  }
}
