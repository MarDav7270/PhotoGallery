TIMELESS PHOTOGRAPHY — CLOUDFLARE R2 MIGRATION

IMPORTANT:
- Revoke the Cloudflare token that was pasted into chat. Create a replacement User API Token with Object Read & Write access limited to bucket photography-client-photos.
- Never put R2 secrets in source files or GitHub.
- This project expects a private R2 bucket. Do not enable public access for this setup.

VERCEL ENVIRONMENT VARIABLES:
R2_ACCOUNT_ID = the account ID in your S3 endpoint hostname
R2_ACCESS_KEY_ID = replacement token's Access Key ID
R2_SECRET_ACCESS_KEY = replacement token's Secret Access Key
R2_BUCKET_NAME = photography-client-photos

Keep existing:
ADMIN_PASSWORD
SESSION_SECRET

Remove old CLOUDINARY_* variables after confirming the R2 migration works.

R2 BUCKET CORS:
In Cloudflare Dashboard > R2 > photography-client-photos > Settings > CORS Policy,
add a rule:
Allowed origins: https://YOUR-PRODUCTION-DOMAIN (and your Vercel preview domain if needed)
Allowed methods: PUT, GET, HEAD
Allowed headers: *
Expose headers: ETag
Max age: 3600

DEPLOY:
1. Merge the api/ and lib/ folders from this package into your existing repository.
2. Replace admin.js, gallery.js, and package.json.
3. Keep all existing files not included here, including index.html, admin.html, styles.css, api/login.js, api/logout.js, api/me.js, and vercel.json.
4. Add the four R2 environment variables to Vercel Production (and Preview if desired).
5. Redeploy.

IMPORTANT MIGRATION LIMIT:
Existing Cloudinary photos are NOT copied to R2 by these code changes. Existing client galleries stored only in Cloudinary will appear empty until their images are migrated. Do not delete your Cloudinary account or old images until you have copied and verified them in R2. Existing gallery slugs/URLs remain the same for newly created R2 folders; existing gallery folder names are not automatically imported.
