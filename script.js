let fotos = [];
let videos = [];
let voteContext = null; // { categoria, participanteId, participanteNome }

function nomeExibicao(item) {
  return item.instagramUser ? `@${item.instagramUser}` : item.nome;
}

function renderGrid(gridId, countId, items, categoria) {
  const grid = document.getElementById(gridId);
  grid.innerHTML = "";
  document.getElementById(countId).textContent = items.length;

  items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "card";

    const thumbHtml =
      categoria === "foto"
        ? item.arquivoUrl
          ? `<img class="thumb" src="${item.arquivoUrl}" alt="${nomeExibicao(item)}">`
          : `<div class="thumb-placeholder">Foto ainda não enviada</div>`
        : item.youtubeId
        ? `<img class="thumb" src="https://img.youtube.com/vi/${item.youtubeId}/hqdefault.jpg" alt="${nomeExibicao(item)}">
           <div class="play-icon"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>`
        : item.driveFileId
        ? `<div class="thumb-placeholder">🎬 Vídeo</div>
           <div class="play-icon"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>`
        : `<div class="thumb-placeholder">Vídeo em breve</div>`;

    const nomeHtml = item.instagramUser
      ? `<a class="name-overlay ig-link" href="https://instagram.com/${item.instagramUser}" target="_blank" rel="noopener">@${item.instagramUser}</a>`
      : `<div class="name-overlay">${item.nome}</div>`;

    card.innerHTML = `
      <div class="thumb-wrap">
        ${thumbHtml}
        ${nomeHtml}
      </div>
      <button class="vote-btn" type="button">Votar</button>
    `;

    const igLink = card.querySelector(".ig-link");
    if (igLink) igLink.addEventListener("click", (e) => e.stopPropagation());

    card.querySelector(".thumb-wrap").addEventListener("click", () => {
      categoria === "foto" ? openLightboxFoto(item) : openLightboxVideo(item);
    });

    card.querySelector(".vote-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      openVoteModal(categoria, item);
    });

    grid.appendChild(card);
  });
}

function openLightboxFoto(item) {
  const body = document.getElementById("lightbox-body");
  body.innerHTML = item.arquivoUrl
    ? `<img src="${item.arquivoUrl}" alt="${nomeExibicao(item)}">`
    : `<div class="thumb-placeholder" style="aspect-ratio:auto;padding:60px;">Foto ainda não enviada</div>`;
  document.getElementById("lightbox-caption").textContent = nomeExibicao(item);
  document.getElementById("lightbox").classList.add("active");
}

function openLightboxVideo(item) {
  const body = document.getElementById("lightbox-body");
  body.innerHTML = item.youtubeId
    ? `<div class="video-frame"><iframe src="https://www.youtube.com/embed/${item.youtubeId}" allow="autoplay; encrypted-media" allowfullscreen></iframe></div>`
    : item.driveFileId
    ? `<div class="video-frame"><iframe src="https://drive.google.com/file/d/${item.driveFileId}/preview" allow="autoplay" allowfullscreen></iframe></div>`
    : `<div class="thumb-placeholder" style="aspect-ratio:auto;padding:60px;">Vídeo ainda não disponível</div>`;
  document.getElementById("lightbox-caption").textContent = nomeExibicao(item);
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

// --- Voto ---

function jaVotouLocal(categoria) {
  return localStorage.getItem(`votou_${categoria}`) === "1";
}

function marcarVotouLocal(categoria) {
  localStorage.setItem(`votou_${categoria}`, "1");
}

function openVoteModal(categoria, item) {
  voteContext = { categoria, participanteId: item.id, participanteNome: item.nome };

  const form = document.getElementById("vote-form");
  form.reset();
  document.getElementById("vote-error").textContent = "";
  document.getElementById("vote-success").style.display = "none";
  form.style.display = "block";

  document.getElementById("vote-modal-title").textContent = `Votar em: ${nomeExibicao(item)}`;
  document.getElementById("vote-modal-sub").textContent =
    categoria === "foto" ? "Categoria Fotos" : "Categoria Vídeos";

  if (jaVotouLocal(categoria)) {
    document.getElementById("vote-error").textContent =
      "Este navegador já registrou um voto nesta categoria.";
  }

  document.getElementById("vote-modal").classList.add("active");
}

function closeVoteModal() {
  document.getElementById("vote-modal").classList.remove("active");
  voteContext = null;
}

document.getElementById("vote-modal-close").addEventListener("click", closeVoteModal);
document.getElementById("vote-modal").addEventListener("click", (e) => {
  if (e.target.id === "vote-modal") closeVoteModal();
});

document.getElementById("vote-cpf").addEventListener("input", (e) => {
  const d = normalizeCPF(e.target.value).slice(0, 11);
  e.target.value = formatCPF(d);
});

document.getElementById("vote-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById("vote-error");
  errorEl.textContent = "";

  const nome = document.getElementById("vote-nome").value.trim();
  const cpf = normalizeCPF(document.getElementById("vote-cpf").value);

  if (nome.length < 3) {
    errorEl.textContent = "Digite seu nome completo.";
    return;
  }
  if (!isValidCPF(cpf)) {
    errorEl.textContent = "CPF inválido. Confira os números digitados.";
    return;
  }

  const submitBtn = e.target.querySelector(".vote-submit");
  submitBtn.disabled = true;
  submitBtn.textContent = "Enviando...";

  const colecao = voteContext.categoria === "foto" ? "votos_fotos" : "votos_videos";

  try {
    await db.collection(colecao).doc(cpf).set({
      participanteId: voteContext.participanteId,
      nome: nome,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    });

    marcarVotouLocal(voteContext.categoria);
    document.getElementById("vote-form").style.display = "none";
    document.getElementById("vote-success").style.display = "block";
  } catch (err) {
    if (err.code === "permission-denied") {
      errorEl.textContent = "Este CPF já votou nesta categoria.";
    } else {
      errorEl.textContent = "Erro ao registrar voto. Tente novamente.";
    }
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Confirmar voto";
  }
});

// --- Tutorial ---

function abrirTutorial() {
  document.getElementById("tutorial-modal").classList.add("active");
}

function fecharTutorial() {
  document.getElementById("tutorial-modal").classList.remove("active");
  localStorage.setItem("tutorial_visto", "1");
}

document.getElementById("ajuda-btn").addEventListener("click", abrirTutorial);
document.getElementById("tutorial-close-btn").addEventListener("click", fecharTutorial);
document.getElementById("tutorial-close-x").addEventListener("click", fecharTutorial);
document.getElementById("tutorial-modal").addEventListener("click", (e) => {
  if (e.target.id === "tutorial-modal") fecharTutorial();
});

if (localStorage.getItem("tutorial_visto") !== "1") {
  abrirTutorial();
}

// --- Firestore live data ---

db.collection("participantes").where("categoria", "==", "foto").onSnapshot((snap) => {
  fotos = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
  renderGrid("grid-fotos", "count-fotos", fotos, "foto");
});

db.collection("participantes").where("categoria", "==", "video").onSnapshot((snap) => {
  videos = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
  renderGrid("grid-videos", "count-videos", videos, "video");
});
