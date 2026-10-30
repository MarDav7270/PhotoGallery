import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export function r2Client() {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = process.env;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    throw new Error("R2 is not configured. Check the R2 environment variables in Vercel.");
  }
  return new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY }
  });
}
export const bucketName = () => {
  if (!process.env.R2_BUCKET_NAME) throw new Error("R2_BUCKET_NAME is missing in Vercel.");
  return process.env.R2_BUCKET_NAME;
};
export async function listAll(prefix, delimiter) {
  const client = r2Client(), out = [];
  let ContinuationToken;
  do {
    const page = await client.send(new ListObjectsV2Command({
      Bucket: bucketName(), Prefix: prefix, Delimiter: delimiter, ContinuationToken
    }));
    out.push(...(page.Contents || []));
    if (delimiter) out.push(...(page.CommonPrefixes || []).map(x => ({ Prefix: x.Prefix })));
    ContinuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (ContinuationToken);
  return out;
}
export async function signedGet(key, filename) {
  const command = new GetObjectCommand({
    Bucket: bucketName(), Key: key,
    ...(filename ? { ResponseContentDisposition: `attachment; filename="${filename.replace(/["\\\r\n]/g, "_")}"` } : {})
  });
  return getSignedUrl(r2Client(), command, { expiresIn: 3600 });
}
