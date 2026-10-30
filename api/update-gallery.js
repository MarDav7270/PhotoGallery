
import { requireAdmin } from "../lib/auth.js";
import { r2Client, bucketName } from "../lib/r2.js";
import {
  GetObjectCommand,
  PutObjectCommand
} from "@aws-sdk/client-s3";

export default async function handler(req, res) {
  if (!requireAdmin(req, res)) return;
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { slug, name } = req.body || {};

    if (!/^[a-z0-9-]{3,70}$/.test(String(slug || ""))) {
      return res.status(400).json({ error: "Invalid gallery." });
    }

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "Enter a gallery name." });
    }

    if (name.trim().length > 100) {
      return res.status(400).json({ error: "Gallery names must be 100 characters or fewer." });
    }

    const client = r2Client();
    const bucket = bucketName();
    const key = `client-galleries/${slug}/.gallery.json`;

    let metadata = { slug, createdAt: new Date().toISOString() };

    try {
      const existing = await client.send(
        new GetObjectCommand({ Bucket: bucket, Key: key })
      );
      const body = await existing.Body.transformToString();
      metadata = { ...metadata, ...JSON.parse(body) };
    } catch (error) {
      if (error.name !== "NoSuchKey" && error.$metadata?.httpStatusCode !== 404) {
        throw error;
      }
    }

    metadata.slug = slug;
    metadata.name = name.trim();
    metadata.updatedAt = new Date().toISOString();

    await client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: JSON.stringify(metadata),
      ContentType: "application/json"
    }));

    return res.status(200).json({
      success: true,
      slug,
      name: metadata.name
    });
  } catch (error) {
    console.error("Update gallery error:", error);
    return res.status(500).json({
      error: error.message || "Could not update gallery name."
    });
  }
}
