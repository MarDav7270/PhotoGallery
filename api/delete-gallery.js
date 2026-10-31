
import { requireAdmin } from "../lib/auth.js";
import { r2Client, bucketName } from "../lib/r2.js";
import {
  ListObjectsV2Command,
  DeleteObjectsCommand
} from "@aws-sdk/client-s3";

export default async function handler(req, res) {
  if (!requireAdmin(req, res)) return;
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { slug } = req.body || {};

    if (!/^[a-z0-9-]{3,70}$/.test(String(slug || ""))) {
      return res.status(400).json({ error: "Invalid gallery." });
    }

    const client = r2Client();
    const bucket = bucketName();
    const prefix = `client-galleries/${slug}/`;

    let continuationToken;
    let deletedCount = 0;

    do {
      const result = await client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken
        })
      );

      const objects = result.Contents || [];

      if (objects.length) {
        const deletion = await client.send(
          new DeleteObjectsCommand({
            Bucket: bucket,
            Delete: {
              Objects: objects.map(obj => ({ Key: obj.Key })),
              Quiet: false
            }
          })
        );

        if (deletion.Errors?.length) {
          throw new Error("Some gallery files could not be deleted.");
        }

        deletedCount += objects.length;
      }

      continuationToken = result.IsTruncated
        ? result.NextContinuationToken
        : undefined;

    } while (continuationToken);

    return res.status(200).json({
      success: true,
      deletedCount
    });

  } catch (error) {
    console.error("Delete gallery error:", error);
    return res.status(500).json({
      error: error.message || "Could not delete gallery."
    });
  }
}
