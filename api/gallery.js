
import { listAll, signedGet, r2Client, bucketName } from "../lib/r2.js";
import { GetObjectCommand } from "@aws-sdk/client-s3";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const slug = String(req.query.slug || "");

  if (!/^[a-z0-9-]{3,70}$/.test(slug)) {
    return res.status(400).json({ error: "Invalid gallery link." });
  }

  try {
    let gallery = { name: "", date: "" };

    try {
      const result = await r2Client().send(new GetObjectCommand({
        Bucket: bucketName(),
        Key: `client-galleries/${slug}/.gallery.json`
      }));

      const body = await result.Body.transformToString();
      const metadata = JSON.parse(body);

      gallery = {
        name: metadata.name || "",
        date: metadata.date || ""
      };
    } catch (error) {
      if (error.name !== "NoSuchKey" && error.$metadata?.httpStatusCode !== 404) {
        throw error;
      }
    }

    const objects = await listAll(`client-galleries/${slug}/`);
    const keys = new Set(objects.map(x => x.Key));

    const originals = objects.filter(x =>
      x.Key &&
      !x.Key.endsWith("/.gallery.json") &&
      !x.Key.endsWith(".preview.jpg") &&
      !x.Key.endsWith(".preview.webp") &&
      x.Size > 0
    );

    const photos = await Promise.all(originals.map(async x => {
      const key = x.Key;
      const filename = key.split("/").pop() || "photo.jpg";
      const webpKey = `${key}.preview.webp`;
      const oldPreviewKey = `${key}.preview.jpg`;

      const previewKey = keys.has(webpKey)
        ? webpKey
        : (keys.has(oldPreviewKey) ? oldPreviewKey : key);

      return {
        url: await signedGet(key),
        previewUrl: await signedGet(previewKey),
        downloadUrl: await signedGet(key, filename),
        key,
        publicId: key,
        format: "jpg",
        createdAt: x.LastModified?.toISOString?.() || null
      };
    }));

    return res.status(200).json({ gallery, photos });
  } catch (error) {
    console.error("Load gallery error:", error);
    return res.status(500).json({
      error: error.message || "Could not load this gallery."
    });
  }
}
