TIMELESS PHOTOGRAPHY — R2 PREVIEW + GALLERY LINK FIX

Replace these files in the existing GitHub repository:
- admin.js
- gallery.js
- api/sign-upload.js
- api/gallery.js
- api/delete-photo.js
- vercel.json

Keep all other existing files, including api/create-gallery.js, api/galleries.js,
lib/r2.js, lib/auth.js, admin.html, gallery.html, styles.css, and package.json.

WHAT THIS UPDATE DOES
- Uploads each original JPEG unchanged to R2.
- Creates a separate 1800px maximum-side JPEG preview at 82% quality for browsing.
- Gallery grid and admin photo manager use previews, reducing browser memory and load time.
- Lightbox and download link use the original JPEG.
- Uploads are processed one at a time to avoid overwhelming the computer.
- Deleting an original also deletes its preview.
- Gallery JS can read the slug from either ?slug=... or /g/slug.
- Restores the /g/:slug Vercel rewrite.

DEPLOY
1. Extract this ZIP.
2. Copy/merge its files into your local GitHub repository, keeping the api folder structure.
3. Commit and push using GitHub Desktop.
4. Wait for Vercel Production deployment to finish.
5. Test with one newly created gallery and one JPEG first.

IMPORTANT
- This does not alter or recompress existing original photos.
- Existing photos without previews continue to display, but will use their original as the preview until you re-upload them or generate previews separately.
- R2 remains private; images are served with temporary signed URLs.
- Browser preview generation uses some CPU briefly per photo, but limits memory by processing one image at a time.
