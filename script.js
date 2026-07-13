function renderFotos() {
  const grid = document.getElementById("grid-fotos");
  document.getElementById("count-fotos").textContent = fotos.length;

  fotos.forEach((item) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img class="thumb" src="${item.arquivo}" alt="${item.participante}"
           onerror="this.outerHTML='<div class=&quot;thumb-placeholder&quot;>Foto ainda não enviada<br>(${item.arquivo})</div>'">
      <div class="label">
        <span class="badge">Foto ${item.id}</span>
        <span class="name">${item.participante}</span>
      </div>
    `;
    card.addEventListener("click", () => openLightboxFoto(item));
    grid.appendChild(card);
  });
}

function renderVideos() {
  const grid = document.getElementById("grid-videos");
  document.getElementById("count-videos").textContent = videos.length;

  videos.forEach((item) => {
    const card = document.createElement("div");
    card.className = "card";

    const thumbHtml = item.youtubeId
      ? `<img class="thumb" src="https://img.youtube.com/vi/${item.youtubeId}/hqdefault.jpg" alt="${item.participante}">
         <div class="play-icon"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>`
      : `<div class="thumb-placeholder">Vídeo em breve<br>(aguardando link)</div>`;

    card.innerHTML = `
      ${thumbHtml}
      <div class="label">
        <span class="badge">Vídeo ${item.id}</span>
        <span class="name">${item.participante}</span>
      </div>
    `;
    card.addEventListener("click", () => openLightboxVideo(item));
    grid.appendChild(card);
  });
}

function openLightboxFoto(item) {
  const body = document.getElementById("lightbox-body");
  body.innerHTML = `<img src="${item.arquivo}" alt="${item.participante}"
    onerror="this.outerHTML='<div class=&quot;thumb-placeholder&quot; style=&quot;aspect-ratio:auto;padding:60px;&quot;>Foto ainda não enviada</div>'">`;
  document.getElementById("lightbox-caption").textContent = `Foto ${item.id} — ${item.participante}`;
  document.getElementById("lightbox").classList.add("active");
}

function openLightboxVideo(item) {
  const body = document.getElementById("lightbox-body");
  if (item.youtubeId) {
    body.innerHTML = `<div class="video-frame"><iframe src="https://www.youtube.com/embed/${item.youtubeId}" allow="autoplay; encrypted-media" allowfullscreen></iframe></div>`;
  } else {
    body.innerHTML = `<div class="thumb-placeholder" style="aspect-ratio:auto;padding:60px;">Vídeo ainda não disponível</div>`;
  }
  document.getElementById("lightbox-caption").textContent = `Vídeo ${item.id} — ${item.participante}`;
  document.getElementById("lightbox").classList.add("active");
}

function closeLightbox() {
  document.getElementById("lightbox").classList.remove("active");
  document.getElementById("lightbox-body").innerHTML = "";
}

document.getElementById("lightbox-close").addEventListener("click", closeLightbox);
document.getElementById("lightbox").addEventListener("click", (e) => {
  if (e.target.id === "lightbox") closeLightbox();
});

document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add("active");
  });
});

function setupVoteLinks() {
  const linkFotos = document.getElementById("link-forms-fotos");
  const linkVideos = document.getElementById("link-forms-videos");

  if (LINK_FORMS_FOTOS) {
    linkFotos.href = LINK_FORMS_FOTOS;
    linkFotos.classList.remove("disabled");
  } else {
    linkFotos.textContent = "Link de votação em breve";
  }

  if (LINK_FORMS_VIDEOS) {
    linkVideos.href = LINK_FORMS_VIDEOS;
    linkVideos.classList.remove("disabled");
  } else {
    linkVideos.textContent = "Link de votação em breve";
  }
}

renderFotos();
renderVideos();
setupVoteLinks();
