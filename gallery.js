
const $ = id => document.getElementById(id);

const yearElement = $("year");
if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

// Support both Vercel's /g/:slug rewrite query and a direct /g/:slug path.
const querySlug = new URLSearchParams(location.search).get("slug");
const pathMatch = location.pathname.match(/^\/g\/([a-z0-9-]{3,70})\/?$/i);
const slug = querySlug || (pathMatch ? pathMatch[1] : null);

let photos = [];
let current = 0;

function openLightbox(i) {
  current = i;
  const p = photos[current];

  $("lightbox-image").src = p.previewUrl || p.url;
  $("lightbox-image").alt = `Photo ${current + 1}`;
  $("lightbox-caption").textContent = `${current + 1} of ${photos.length}`;
  $("lightbox-download").href = p.downloadUrl || p.url;
  $("lightbox-download").removeAttribute("download");

  $("lightbox").classList.add("open");
  $("lightbox").setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  $("lightbox").classList.remove("open");
  $("lightbox").setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  $("lightbox-image").src = "";
}

function move(n) {
  if (!photos.length) return;
  current = (current + n + photos.length) % photos.length;
  openLightbox(current);
}

// Lightbox controls
if ($("lightbox-close")) $("lightbox-close").onclick = closeLightbox;
if ($("lightbox-prev")) $("lightbox-prev").onclick = () => move(-1);
if ($("lightbox-next")) $("lightbox-next").onclick = () => move(1);

if ($("lightbox")) {
  $("lightbox").addEventListener("click", e => {
    if (e.target === $("lightbox")) closeLightbox();
  });
}

document.addEventListener("keydown", e => {
  if (!$("lightbox")?.classList.contains("open")) return;

  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowRight") move(1);
  if (e.key === "ArrowLeft") move(-1);
});

// Load gallery
async function init() {
  const status = $("gallery-status");

  if (!slug) {
    if (status) {
      status.textContent = "This gallery link is invalid. Please use the complete client gallery link.";
    }
    return;
  }

  try {
    const r = await fetch(`/api/gallery?slug=${encodeURIComponent(slug)}`);
    const d = await r.json();

    if (!r.ok) {
      throw new Error(d.error || "Unable to load gallery.");
    }

    photos = d.photos || [];

    // Generate a fallback title if no custom name exists.
    const fallbackName = slug
      .replace(/-[a-f0-9]{8}$/, "")
      .replace(/-/g, " ")
      .replace(/\b\w/g, c => c.toUpperCase());

    // Display the custom name saved in Admin.
    const titleElement = $("gallery-title");

    if (titleElement) {
      titleElement.textContent = d.gallery?.name || fallbackName;
    }

    // Display the gallery date, if available.
    const dateElement = $("gallery-date");

    if (dateElement && d.gallery?.date) {
      dateElement.textContent = d.gallery.date;
    }

    // Update photo count.
    const countElement = $("photo-count");

    if (countElement) {
      countElement.textContent =
        `${photos.length} ${photos.length === 1 ? "PHOTO" : "PHOTOS"}`;
    }

    // Display photos.
    const grid = $("photo-grid");

    if (!grid) {
      throw new Error("The photo grid is missing from gallery.html.");
    }

    grid.innerHTML = "";

    photos.forEach((p, i) => {
      const b = document.createElement("button");
      b.className = "photo-card";
      b.setAttribute("aria-label", `Open photo ${i + 1}`);

      const img = document.createElement("img");
      img.src = p.previewUrl || p.url;
      img.alt = `Gallery photo ${i + 1}`;
      img.loading = "lazy";

      b.append(img);
      b.onclick = () => openLightbox(i);

      grid.append(b);
    });

    if (status) {
      status.textContent = photos.length
        ? ""
        : "Your photos are being prepared. Please check back soon.";
    }

  } catch (e) {
    console.error("Gallery loading error:", e);

    if (status) {
      status.textContent = e.message;
    }
  }
}

init();
