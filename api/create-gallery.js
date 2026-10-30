import { requireAdmin, slugify } from "../lib/auth.js";
import crypto from "node:crypto";
import { r2Client, bucketName } from "../lib/r2.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";

export default async function handler(req, res) {
  if (!requireAdmin(req, res)) return;
  if (req.method !== "POST") return res.status(405).end();
  try {
    const { name, date = "" } = req.body || {};
    if (!name?.trim()) return res.status(400).json({ error: "Enter a client or session name." });
    const base = slugify(name);
    if (!base) return res.status(400).json({ error: "Please use a name with letters or numbers." });
    const slug = `${base}-${crypto.randomBytes(4).toString("hex")}`;
    const metadata = JSON.stringify({ slug, name: name.trim(), date, createdAt: new Date().toISOString() });
    await r2Client().send(new PutObjectCommand({
      Bucket: bucketName(), Key: `client-galleries/${slug}/.gallery.json`,
      Body: metadata, ContentType: "application/json"
    }));
    return res.status(200).json({
      slug, name: name.trim(), date,
      url: `${req.headers["x-forwarded-proto"] || "https"}://${req.headers.host}/g/${slug}`
    });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Could not create gallery." });
  }
}
