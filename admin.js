const ADMIN_UID = "COLE_O_UID_DO_ADMIN_AQUI";

const storage = firebase.storage();
const auth = firebase.auth();

let fotosCache = [];
let videosCache = [];
let editContext = null; // { mode: 'create'|'edit', categoria, docId }

// --- Login ---

auth.onAuthStateChanged((user) => {
  if (user && user.uid === ADMIN_UID) {
    document.getElementById("login-box").style.display = "none";
    document.getElementById("admin-panel").style.display = "block";
    document.getElementById("admin-user").textContent = user.email;
    iniciarPainel();
  } else if (user) {
    document.getElementById("login-error").textContent = "Esta conta não tem acesso de admin.";
    auth.signOut();
  } else {
    document.getElementById("login-box").style.display = "block";
    document.getElementById("admin-panel").style.display = "none";
  }
});

document.getElementById("login-btn").addEventListener("click", () => {
  const email = document.getElementById("login-email").value.trim();
  const senha = document.getElementById("login-senha").value;
  const errorEl = document.getElementById("login-error");
  errorEl.textContent = "";

  auth.signInWithEmailAndPassword(email, senha).catch((err) => {
    errorEl.textContent = "Login inválido.";
  });
});

document.getElementById("logout-btn").addEventListener("click", () => auth.signOut());

// --- Tabs ---

document.querySelectorAll("[data-atab]").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("[data-atab]").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".admin-section").forEach((s) => s.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(`atab-${btn.dataset.atab}`).classList.add("active");

    if (btn.dataset.atab === "votos") carregarContagem();
    if (btn.dataset.atab === "votantes") carregarVotantes();
  });
});

let painelIniciado = false;
function iniciarPainel() {
  if (painelIniciado) return;
  painelIniciado = true;
  carregarParticipantes();

  document.querySelectorAll("[data-add]").forEach((btn) => {
    btn.addEventListener("click", () => abrirModalEdicao(btn.dataset.add, null));
  });

  document.getElementById("seed-btn").addEventListener("click", criarParticipantesPadrao);
  document.getElementById("export-csv-btn").addEventListener("click", exportarCSV);
}

// --- Participantes (lista + CRUD) ---

function carregarParticipantes() {
  db.collection("participantes").onSnapshot((snap) => {
    const todos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    fotosCache = todos.filter((p) => p.categoria === "foto").sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
    videosCache = todos.filter((p) => p.categoria === "video").sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
    renderAdminList("admin-fotos", fotosCache, "foto");
    renderAdminList("admin-videos", videosCache, "video");
  });
}

function renderAdminList(containerId, items, categoria) {
  const el = document.getElementById(containerId);
  el.innerHTML = "";
  items.forEach((item) => {
    const thumb =
      categoria === "foto"
        ? item.arquivoUrl
          ? `<img src="${item.arquivoUrl}">`
          : `<img src="">`
        : item.youtubeId
        ? `<img src="https://img.youtube.com/vi/${item.youtubeId}/default.jpg">`
        : `<img src="">`;

    const row = document.createElement("div");
    row.className = "admin-row";
    row.innerHTML = `
      <span class="row-order">#${item.ordem ?? "-"}</span>
      ${thumb}
      <span class="row-name">${item.nome}</span>
      <button data-edit="${item.id}">Editar</button>
    `;
    row.querySelector("[data-edit]").addEventListener("click", () => abrirModalEdicao(categoria, item));
    el.appendChild(row);
  });
}

function extrairYoutubeId(valor) {
  const v = valor.trim();
  const match = v.match(/(?:youtu\.be\/|v=|embed\/)([a-zA-Z0-9_-]{6,})/);
  return match ? match[1] : v;
}

function abrirModalEdicao(categoria, item) {
  editContext = { mode: item ? "edit" : "create", categoria, docId: item ? item.id : null, ordemAtual: item ? item.ordem : null };

  document.getElementById("edit-modal-title").textContent = item ? `Editar ${item.nome}` : "Novo participante";
  document.getElementById("edit-nome").value = item ? item.nome : "";
  document.getElementById("edit-arquivo").value = "";
  document.getElementById("edit-youtube-id").value = item ? item.youtubeId || "" : "";
  document.getElementById("edit-error").textContent = "";

  document.getElementById("edit-foto-label").style.display = categoria === "foto" ? "block" : "none";
  document.getElementById("edit-video-label").style.display = categoria === "video" ? "block" : "none";
  document.getElementById("edit-delete-btn").style.display = item ? "block" : "none";

  document.getElementById("edit-modal").classList.add("active");
}

document.getElementById("edit-modal-close").addEventListener("click", () => {
  document.getElementById("edit-modal").classList.remove("active");
});

document.getElementById("edit-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById("edit-error");
  errorEl.textContent = "";

  const nome = document.getElementById("edit-nome").value.trim();
  if (nome.length < 2) {
    errorEl.textContent = "Digite um nome.";
    return;
  }

  const saveBtn = document.getElementById("edit-save-btn");
  saveBtn.disabled = true;
  saveBtn.textContent = "Salvando...";

  try {
    const dados = { nome, categoria: editContext.categoria };

    if (editContext.categoria === "foto") {
      const file = document.getElementById("edit-arquivo").files[0];
      if (file) {
        const path = `fotos/${editContext.docId || Date.now()}-${file.name}`;
        const ref = storage.ref(path);
        await ref.put(file);
        dados.arquivoUrl = await ref.getDownloadURL();
      }
    } else {
      const raw = document.getElementById("edit-youtube-id").value.trim();
      if (raw) dados.youtubeId = extrairYoutubeId(raw);
    }

    if (editContext.mode === "create") {
      const listaAtual = editContext.categoria === "foto" ? fotosCache : videosCache;
      const maiorOrdem = listaAtual.reduce((max, p) => Math.max(max, p.ordem ?? 0), 0);
      dados.ordem = maiorOrdem + 1;
      await db.collection("participantes").add(dados);
    } else {
      await db.collection("participantes").doc(editContext.docId).set(dados, { merge: true });
    }

    document.getElementById("edit-modal").classList.remove("active");
  } catch (err) {
    errorEl.textContent = "Erro ao salvar: " + err.message;
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Salvar";
  }
});

document.getElementById("edit-delete-btn").addEventListener("click", async () => {
  if (!editContext || !editContext.docId) return;
  if (!confirm("Remover este participante? Os votos já registrados continuam guardados, mas o card some da página pública.")) return;

  await db.collection("participantes").doc(editContext.docId).delete();
  document.getElementById("edit-modal").classList.remove("active");
});

async function criarParticipantesPadrao() {
  const snap = await db.collection("participantes").limit(1).get();
  if (!snap.empty) {
    if (!confirm("Já existem participantes cadastrados. Ainda assim criar o lote padrão (18 fotos + 6 vídeos)?")) return;
  }

  const batch = db.batch();
  for (let i = 1; i <= SEED_FOTOS_COUNT; i++) {
    const ref = db.collection("participantes").doc();
    batch.set(ref, { nome: `Participante ${i}`, categoria: "foto", ordem: i, arquivoUrl: null });
  }
  for (let i = 1; i <= SEED_VIDEOS_COUNT; i++) {
    const ref = db.collection("participantes").doc();
    batch.set(ref, { nome: `Participante ${i}`, categoria: "video", ordem: i, youtubeId: "" });
  }
  await batch.commit();
}

// --- Contagem de votos ---

async function carregarContagem() {
  await renderTally("votos_fotos", "tally-fotos", fotosCache);
  await renderTally("votos_videos", "tally-videos", videosCache);
}

async function renderTally(colecao, containerId, participantes) {
  const snap = await db.collection(colecao).get();
  const contagem = {};
  snap.forEach((doc) => {
    const pid = doc.data().participanteId;
    contagem[pid] = (contagem[pid] || 0) + 1;
  });

  const nomeDe = (id) => participantes.find((p) => p.id === id)?.nome || "Participante removido";

  const linhas = Object.keys(contagem)
    .map((pid) => ({ pid, nome: nomeDe(pid), total: contagem[pid] }))
    .sort((a, b) => b.total - a.total);

  const max = linhas.length ? linhas[0].total : 1;
  const el = document.getElementById(containerId);
  el.innerHTML = linhas.length
    ? linhas
        .map(
          (l) => `
        <div class="tally-row">
          <span class="tally-name">${l.nome}</span>
          <div class="tally-bar" style="width:${Math.max(6, (l.total / max) * 160)}px"></div>
          <span class="tally-count">${l.total}</span>
        </div>`
        )
        .join("")
    : `<div class="tally-row"><span class="tally-name">Nenhum voto ainda</span></div>`;
}

// --- Lista de votantes ---

let votantesCache = [];

async function carregarVotantes() {
  const [fotosSnap, videosSnap] = await Promise.all([
    db.collection("votos_fotos").get(),
    db.collection("votos_videos").get(),
  ]);

  const nomeFoto = (id) => fotosCache.find((p) => p.id === id)?.nome || "Participante removido";
  const nomeVideo = (id) => videosCache.find((p) => p.id === id)?.nome || "Participante removido";

  const linhas = [
    ...fotosSnap.docs.map((d) => ({ categoria: "Foto", cpf: d.id, ...d.data(), votouEm: nomeFoto(d.data().participanteId) })),
    ...videosSnap.docs.map((d) => ({ categoria: "Vídeo", cpf: d.id, ...d.data(), votouEm: nomeVideo(d.data().participanteId) })),
  ].sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));

  votantesCache = linhas;

  const tbody = document.querySelector("#voters-table tbody");
  tbody.innerHTML = linhas
    .map((l) => {
      const quando = l.timestamp ? new Date(l.timestamp.seconds * 1000).toLocaleString("pt-BR") : "-";
      return `<tr><td>${l.categoria}</td><td>${l.nome}</td><td>${formatCPF(l.cpf)}</td><td>${l.votouEm}</td><td>${quando}</td></tr>`;
    })
    .join("");
}

function exportarCSV() {
  const linhas = [["Categoria", "Nome do votante", "CPF", "Votou em", "Quando"]];
  votantesCache.forEach((l) => {
    const quando = l.timestamp ? new Date(l.timestamp.seconds * 1000).toLocaleString("pt-BR") : "-";
    linhas.push([l.categoria, l.nome, formatCPF(l.cpf), l.votouEm, quando]);
  });

  const csv = linhas.map((linha) => linha.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "votantes-exoticos-pp.csv";
  a.click();
  URL.revokeObjectURL(url);
}
