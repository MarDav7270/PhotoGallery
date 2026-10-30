const $=id=>document.getElementById(id);$("year").textContent=new Date().getFullYear();
// Support both Vercel's /g/:slug rewrite query and a direct /g/:slug path.
const querySlug=new URLSearchParams(location.search).get("slug");
const pathMatch=location.pathname.match(/^\/g\/([a-z0-9-]{3,70})\/?$/i);
const slug=querySlug||(pathMatch?pathMatch[1]:null);
let photos=[],current=0;
function openLightbox(i){current=i;const p=photos[current];$("lightbox-image").src=p.previewUrl||p.url;$("lightbox-image").alt=`Photo ${current+1}`;$("lightbox-caption").textContent=`${current+1} of ${photos.length}`;$("lightbox-download").href=p.downloadUrl||p.url;$("lightbox-download").removeAttribute("download");$("lightbox").classList.add("open");$("lightbox").setAttribute("aria-hidden","false");document.body.style.overflow="hidden"}
function closeLightbox(){$("lightbox").classList.remove("open");$("lightbox").setAttribute("aria-hidden","true");document.body.style.overflow="";$("lightbox-image").src=""}
function move(n){current=(current+n+photos.length)%photos.length;openLightbox(current)}
$("lightbox-close").onclick=closeLightbox;$("lightbox-prev").onclick=()=>move(-1);$("lightbox-next").onclick=()=>move(1);
$("lightbox").addEventListener("click",e=>{if(e.target===$("lightbox"))closeLightbox()});
document.addEventListener("keydown",e=>{if(!$("lightbox").classList.contains("open"))return;if(e.key==="Escape")closeLightbox();if(e.key==="ArrowRight")move(1);if(e.key==="ArrowLeft")move(-1)});
async function init(){
  if(!slug){$("gallery-status").textContent="This gallery link is invalid. Please use the complete client gallery link.";return}
  try{
    const r=await fetch(`/api/gallery?slug=${encodeURIComponent(slug)}`);const d=await r.json();
    if(!r.ok)throw new Error(d.error||"Unable to load gallery.");
    photos=d.photos||[];
    const titleElement = $("gallery-title");

if (titleElement) {
  titleElement.textContent = slug
    .replace(/-[a-f0-9]{8}$/, "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase());
}
    $("photo-count").textContent=`${photos.length} ${photos.length===1?"PHOTO":"PHOTOS"}`;
    const grid=$("photo-grid");grid.innerHTML="";
    photos.forEach((p,i)=>{
      const b=document.createElement("button");b.className="photo-card";b.setAttribute("aria-label",`Open photo ${i+1}`);
      const img=document.createElement("img");img.src=p.previewUrl||p.url;img.alt=`Gallery photo ${i+1}`;img.loading="lazy";
      b.append(img);b.onclick=()=>openLightbox(i);grid.append(b);
    });
    $("gallery-status").textContent=photos.length?"":"Your photos are being prepared. Please check back soon.";
  }catch(e){$("gallery-status").textContent=e.message}
}
init();
