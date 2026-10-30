
import { requireAdmin } from "../lib/auth.js";
import { listAll, r2Client, bucketName } from "../lib/r2.js";
import { GetObjectCommand } from "@aws-sdk/client-s3";

async function getGalleryName(slug) {
  try {
    const result = await r2Client().send(new GetObjectCommand({
      Bucket: bucketName(),
      Key: `client-galleries/${slug}/.gallery.json`
    }));

    const body = await result.Body.transformToString();
    const metadata = JSON.parse(body);
    return metadata.name || "";
  } catch {
    return "";
  }
}

export default async function handler(req, res) {
  if (!requireAdmin(req, res)) return;
  if (req.method !== "GET") return res.status(405).end();

  try {
    const prefixes = await listAll("client-galleries/", "/");

    const folders = await Promise.all(
      prefixes.map(async x => {
        const name = (x.Prefix || "")
          .replace(/^client-galleries\//, "")
          .replace(/\/$/, "");

        if (!/^[a-z0-9-]{3,70}$/.test(name)) return null;

        return {
          name,
          displayName: await getGalleryName(name),
          path: x.Prefix
        };
      })
    );

    return res.status(200).json({
      folders: folders.filter(Boolean)
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Could not load galleries."
    });
  }
}
