
async function loadGalleries() {
  const box = $("gallery-list");
  box.innerHTML = '<p class="muted">Loading…</p>';

  const d = await api("/api/galleries");

  if (!d.folders.length) {
    box.innerHTML = '<p class="muted">No galleries yet. Create your first one above.</p>';
    return;
  }

  box.innerHTML = "";

  for (const f of d.folders) {
    const slug = f.name;
    const url = `${location.origin}/g/${slug}`;
    const displayName = f.displayName ||
      slug.replace(/-[a-f0-9]{8}$/, "")
        .replace(/-/g, " ")
        .replace(/\b\w/g, c => c.toUpperCase());

    const el = document.createElement("article");
    el.className = "admin-gallery";

    const info = document.createElement("div");

    const title = document.createElement("h3");
    title.textContent = displayName;

    const sub = document.createElement("p");
    sub.textContent = url;

    info.append(title, sub);

    const actions = document.createElement("div");
    actions.className = "admin-gallery-actions";

    const open = document.createElement("a");
    open.className = "small-button";
    open.href = url;
    open.target = "_blank";
    open.rel = "noopener";
    open.textContent = "View gallery";

    const copy = document.createElement("button");
    copy.className = "small-button";
    copy.textContent = "Copy link";
    copy.onclick = () => navigator.clipboard.writeText(url);

    const edit = document.createElement("button");
    edit.className = "small-button";
    edit.textContent = "Edit name";

    const upload = document.createElement("button");
    upload.className = "small-button";
    upload.textContent = "Manage photos";
    upload.onclick = () => openUpload(slug, title.textContent);

    actions.append(open, copy, edit, upload);
    el.append(info, actions);

    const editPanel = document.createElement("div");
    editPanel.className = "gallery-name-editor";
    editPanel.hidden = true;

    const input = document.createElement("input");
    input.type = "text";
    input.maxLength = 100;
    input.value = displayName;
    input.placeholder = "Enter gallery name";
    input.setAttribute("aria-label", "Gallery display name");

    const save = document.createElement("button");
    save.className = "small-button";
    save.textContent = "Save";

    const cancel = document.createElement("button");
    cancel.className = "small-button";
    cancel.textContent = "Cancel";

    const message = document.createElement("p");
    message.className = "muted small";

    editPanel.append(input, save, cancel, message);
    el.append(editPanel);

    edit.onclick = () => {
      editPanel.hidden = false;
      input.focus();
      input.select();
    };

    cancel.onclick = () => {
      input.value = title.textContent;
      message.textContent = "";
      editPanel.hidden = true;
    };

    save.onclick = async () => {
      const newName = input.value.trim();

      if (!newName) {
        message.textContent = "Enter a gallery name.";
        return;
      }

      save.disabled = true;
      message.textContent = "Saving…";

      try {
        await api("/api/update-gallery", {
          method: "POST",
          body: JSON.stringify({ slug, name: newName })
        });

        title.textContent = newName;
        message.textContent = "Gallery name updated.";
        editPanel.hidden = true;
      } catch (error) {
        message.textContent = error.message;
      } finally {
        save.disabled = false;
      }
    };

    box.append(el);
  }
}
