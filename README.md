# Timeless Photography — Client Galleries

A lightweight Vercel gallery site with a password-protected admin area and Cloudinary image storage.

## Features
- Password-protected admin dashboard
- Create client galleries
- Upload multiple photos directly from the dashboard
- Share a unique gallery URL with each client
- Responsive photo grid and fullscreen lightbox
- Previous/next navigation, keyboard support, and individual downloads
- Photos live in Cloudinary, not in the Vercel deployment

## 1. Create a Cloudinary account
1. Create a free account at https://cloudinary.com/
2. From the Cloudinary Dashboard, copy your **Cloud Name**, **API Key**, and **API Secret**.
3. Keep the API Secret private. Never put it in browser-side code.

## 2. Deploy to Vercel
1. Create a new GitHub repository and upload the contents of this folder.
2. Import that repository into https://vercel.com/
3. In Vercel, open **Project Settings → Environment Variables**.
4. Add all five variables from `.env.example`:
   - `ADMIN_PASSWORD`: a strong password only you know
   - `SESSION_SECRET`: a long random string (at least 32 characters)
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
5. Redeploy after adding the variables.

## 3. Use the dashboard
- Visit `/admin.html` on your deployed site.
- Sign in with `ADMIN_PASSWORD`.
- Create a gallery and upload photos.
- Copy the generated client link and send it to your client.

Gallery links use a random suffix, for example `/g/smith-family-a8f3c1d2`. Treat the link as private: anyone who has it can view and download that gallery.

## Important notes
- This starter uses Cloudinary folders and the Cloudinary Admin API. Cloudinary's current plan limits and storage/bandwidth allowances apply.
- The gallery is private by unlisted link, not by a client password. Do not share the link publicly.
- Vercel environment variables are server-side. Do not add secrets to HTML or JavaScript.
- The first version supports individual photo downloads. A downloadable ZIP for the entire gallery can be added later.
- Use JPEG/WebP images sized for delivery. Keep your original RAW files backed up separately.
