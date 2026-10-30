const $=id=>document.getElementById(id);
$("year").textContent=new Date().getFullYear();
async function api(url,options={}){const r=await fetch(url,{...options,headers:{"Content-Type":"application/json",...(options.headers||{})}});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||"Something went wrong.");return d}
function showDashboard(){ $("login-panel").hidden=true;$("dashboard").hidden=false;loadGalleries().catch(e=>$("dashboard-error").textContent=e.message)}
function showLogin(){ $("login-panel").hidden=false;$("dashboard").hidden=true}
async function init(){try{const d=await api("/api/me");if(d.authenticated)showDashboard();else showLogin()}catch{showLogin()}}
$("login-form").addEventListener("submit",async e=>{e.preventDefault();$("login-error").textContent="";try{await api("/api/login",{method:"POST",body:JSON.stringify({password:$("password").value})});$("password").value="";showDashboard()}catch(err){$("login-error").textContent=err.message}});
$("logout").addEventListener("click",async()=>{await api("/api/logout",{method:"POST"});showLogin()});
$("refresh").addEventListener("click",()=>loadGalleries());
$("create-form").addEventListener("submit",async e=>{e.preventDefault();const msg=$("create-message");msg.textContent="Creating gallery…";try{const d=await api("/api/create-gallery",{method:"POST",body:JSON.stringify({name:$("client-name").value,date:$("session-date").value})});msg.innerHTML=`Gallery created. <a href="${d.url}" target="_blank" rel="noopener">Open gallery</a> · <button class="text-button" id="copy-new">Copy client link</button>`;$("copy-new").onclick=()=>navigator.clipboard.writeText(d.url);$("client-name").value="";$("session-date").value="";await loadGalleries()}catch(err){msg.textContent=err.message}});
async function loadGalleries(){const box=$("gallery-list");box.innerHTML='<p class="muted">Loading…</p>';const d=await api("/api/galleries");if(!d.folders.length){box.innerHTML='<p class="muted">No galleries yet. Create your first one above.</p>';return}box.innerHTML="";for(const f of d.folders){const slug=f.name;const url=`${location.origin}/g/${slug}`;const el=document.createElement("article");el.className="admin-gallery";const info=document.createElement("div");const title=document.createElement("h3");title.textContent=slug.replace(/-[a-f0-9]{8}$/,"").replace(/-/g," ").replace(/\b\w/g,c=>c.toUpperCase());const sub=document.createElement("p");sub.textContent=url;info.append(title,sub);const actions=document.createElement("div");actions.className="admin-gallery-actions";const open=document.createElement("a");open.className="small-button";open.href=url;open.target="_blank";open.rel="noopener";open.textContent="View gallery";const copy=document.createElement("button");copy.className="small-button";copy.textContent="Copy link";copy.onclick=()=>navigator.clipboard.writeText(url);const upload=document.createElement("button");upload.className="small-button";upload.textContent="Manage photos";upload.onclick=()=>openUpload(slug,title.textContent);actions.append(open,copy,upload);el.append(info,actions);box.append(el)}}

// Create a separate browsing preview. The original JPEG is uploaded unchanged.
async function makePreview(file,maxSide=1200,quality=.68){
  const bitmap=await createImageBitmap(file);
  const scale=Math.min(1,maxSide/Math.max(bitmap.width,bitmap.height));
  const canvas=document.createElement("canvas");
  canvas.width=Math.max(1,Math.round(bitmap.width*scale));
  canvas.height=Math.max(1,Math.round(bitmap.height*scale));
  const ctx=canvas.getContext("2d",{alpha:false});
  ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
  bitmap.close();
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/jpeg",quality));
  canvas.width=1;canvas.height=1;
  if(!blob)throw new Error("Could not create a preview.");
  return blob;
}
async function putFile(url,file,type){
  const r=await fetch(url,{method:"PUT",headers:{"Content-Type":type},body:file});
  if(!r.ok){const t=await r.text();throw new Error(`Storage upload failed (${r.status}). ${t.slice(0,140)}`)}
}
function openUpload(slug,name){
  const old=document.getElementById("upload-panel");if(old)old.remove();
  const panel=document.createElement("section");panel.id="upload-panel";panel.className="panel";
  panel.innerHTML=`<div class="section-heading"><div><h2>Manage photos</h2><p class="muted small">${name}</p></div><button class="text-button" id="close-upload">Close</button></div><label for="photo-files">Choose original JPEG photos (up to 100 MB each)</label><input id="photo-files" type="file" accept="image/jpeg,.jpg,.jpeg" multiple><p id="upload-status" class="muted small">Original JPEGs are preserved. Smaller previews are created for faster gallery browsing.</p><progress id="upload-progress" value="0" max="100" style="width:100%;display:none"></progress><div id="manage-photo-grid" class="manage-photo-grid"></div>`;
  $("dashboard").insertBefore(panel,$("dashboard-error"));$("close-upload").onclick=()=>panel.remove();
  $("photo-files").onchange=async e=>{
    const files=[...e.target.files],status=$("upload-status"),progress=$("upload-progress"),input=e.target;
    let succeeded=0,failed=[];input.disabled=true;progress.style.display="block";progress.value=0;
    for(let i=0;i<files.length;i++){
      const file=files[i];status.textContent=`Preparing ${i+1} of ${files.length}: ${file.name}`;
      try{
        if(!/^image\/jpeg$/i.test(file.type))throw new Error("This file is not a JPEG.");
        if(file.size>100*1024*1024)throw new Error("This photo is larger than 100 MB.");
        const preview=await makePreview(file);
        const sig=await api("/api/sign-upload",{method:"POST",body:JSON.stringify({slug,filename:file.name,contentType:"image/jpeg",size:file.size,previewSize:preview.size})});
        status.textContent=`Uploading original ${i+1} of ${files.length}: ${file.name}`;
        await putFile(sig.uploadUrl,file,"image/jpeg");
        status.textContent=`Uploading preview ${i+1} of ${files.length}: ${file.name}`;
        await putFile(sig.previewUploadUrl,preview,"image/jpeg");
        succeeded++;
      }catch(err){failed.push(`${file.name}: ${err.message}`)}
      progress.value=Math.round(((i+1)/files.length)*100);
      status.textContent=`Processed ${i+1} of ${files.length} · ${succeeded} successful${failed.length?` · ${failed.length} failed`:""}`;
    }
    input.disabled=false;input.value="";
    status.textContent=`Uploaded ${succeeded} of ${files.length} photos.${failed.length?` Failed: ${failed.slice(0,3).join(" | ")}`:" Original JPEGs preserved; previews optimized."}`;
    await loadManagePhotos(slug);
  };
  loadManagePhotos(slug);
}
async function loadManagePhotos(slug){
  const box=$("manage-photo-grid");if(!box)return;
  try{
    const d=await api(`/api/gallery?slug=${encodeURIComponent(slug)}`);box.innerHTML="";
    for(const p of d.photos){
      const item=document.createElement("div");item.className="manage-photo";
      const img=document.createElement("img");img.src=p.previewUrl||p.url;img.alt="";img.loading="lazy";
      const del=document.createElement("button");del.textContent="Delete";
      del.onclick=async()=>{if(!confirm("Delete this photo permanently?"))return;try{await api("/api/delete-photo",{method:"POST",body:JSON.stringify({key:p.key||p.publicId})});loadManagePhotos(slug)}catch(e){alert(e.message)}};
      item.append(img,del);box.append(item);
    }
    if(!d.photos.length)box.innerHTML='<p class="muted small">No photos uploaded yet.</p>';
  }catch(e){box.textContent=e.message}
}
init();
