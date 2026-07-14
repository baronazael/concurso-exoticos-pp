import { test, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from "@firebase/rules-unit-testing";

// Precisa bater com os UIDs hardcoded em firestore.rules (isAdmin()).
// Se trocar/adicionar admin em producao, atualize os dois lugares.
const ADMIN_UID = "Wn5M3EGo8thlchIfqFgxwhfgvo22";
const ADMIN_UID_2 = "lvXffI2cgXSMiLapxOwbHAw4DVK2";
const OUTRO_UID = "algum-outro-usuario";

let testEnv;

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "concurso-exoticos-pp-test",
    firestore: {
      rules: readFileSync(new URL("../firestore.rules", import.meta.url), "utf8"),
      host: "127.0.0.1",
      port: 8080,
    },
  });
});

after(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

function publico() {
  return testEnv.unauthenticatedContext().firestore();
}

function admin() {
  return testEnv.authenticatedContext(ADMIN_UID).firestore();
}

function admin2() {
  return testEnv.authenticatedContext(ADMIN_UID_2).firestore();
}

function usuarioComum() {
  return testEnv.authenticatedContext(OUTRO_UID).firestore();
}

async function seed(caminho, dados) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc(caminho).set(dados);
  });
}

// --- votos_fotos ---

test("aceita voto valido (CPF 11 digitos + campos obrigatorios) sem precisar de login", async () => {
  await assertSucceeds(
    publico().doc("votos_fotos/12345678901").set({
      participanteId: "p1",
      nome: "Fulano de Tal",
      timestamp: new Date(),
    })
  );
});

test("rejeita id que nao tem 11 digitos", async () => {
  await assertFails(
    publico().doc("votos_fotos/123").set({ participanteId: "p1", nome: "Fulano", timestamp: new Date() })
  );
});

test("rejeita id com caracteres nao numericos", async () => {
  await assertFails(
    publico().doc("votos_fotos/1234567890a").set({ participanteId: "p1", nome: "Fulano", timestamp: new Date() })
  );
});

test("rejeita voto sem o campo nome", async () => {
  await assertFails(
    publico().doc("votos_fotos/12345678901").set({ participanteId: "p1", timestamp: new Date() })
  );
});

test("rejeita voto sem participanteId", async () => {
  await assertFails(
    publico().doc("votos_fotos/12345678901").set({ nome: "Fulano", timestamp: new Date() })
  );
});

test("bloqueia segundo voto com o mesmo CPF na mesma categoria", async () => {
  const db = publico();
  await assertSucceeds(
    db.doc("votos_fotos/12345678901").set({ participanteId: "p1", nome: "Fulano", timestamp: new Date() })
  );
  // mesmo doc ja existe -> isso conta como "update", que a regra proibe
  await assertFails(
    db.doc("votos_fotos/12345678901").set({ participanteId: "p2", nome: "Fulano", timestamp: new Date() })
  );
});

test("mesmo CPF pode votar em fotos E em videos (categorias independentes)", async () => {
  await assertSucceeds(
    publico().doc("votos_fotos/12345678901").set({ participanteId: "p1", nome: "Fulano", timestamp: new Date() })
  );
  await assertSucceeds(
    publico().doc("votos_videos/12345678901").set({ participanteId: "v1", nome: "Fulano", timestamp: new Date() })
  );
});

test("ninguem consegue ler a contagem de votos, exceto o admin", async () => {
  await seed("votos_fotos/12345678901", { participanteId: "p1", nome: "Fulano", timestamp: new Date() });

  await assertFails(publico().doc("votos_fotos/12345678901").get());
  await assertFails(usuarioComum().doc("votos_fotos/12345678901").get());
  await assertSucceeds(admin().doc("votos_fotos/12345678901").get());
});

test("ninguem consegue apagar ou sobrescrever um voto existente, nem o admin", async () => {
  await seed("votos_fotos/12345678901", { participanteId: "p1", nome: "Fulano", timestamp: new Date() });

  await assertFails(admin().doc("votos_fotos/12345678901").delete());
  await assertFails(admin().doc("votos_fotos/12345678901").set({ participanteId: "p2", nome: "X", timestamp: new Date() }));
});

// --- participantes ---

test("qualquer um le a lista de participantes", async () => {
  await seed("participantes/p1", { nome: "Participante 1", categoria: "foto", ordem: 1 });
  await assertSucceeds(publico().doc("participantes/p1").get());
});

test("so o admin escreve em participantes", async () => {
  await assertFails(publico().doc("participantes/novo").set({ nome: "X", categoria: "foto", ordem: 99 }));
  await assertFails(usuarioComum().doc("participantes/novo").set({ nome: "X", categoria: "foto", ordem: 99 }));
  await assertSucceeds(admin().doc("participantes/novo").set({ nome: "X", categoria: "foto", ordem: 99 }));
});

test("admin consegue remover participante", async () => {
  await seed("participantes/p1", { nome: "Participante 1", categoria: "foto", ordem: 1 });
  await assertSucceeds(admin().doc("participantes/p1").delete());
});

test("segundo admin da lista tambem tem acesso de admin", async () => {
  await assertSucceeds(admin2().doc("participantes/novo2").set({ nome: "Y", categoria: "foto", ordem: 100 }));
});

// --- prazo de votacao (config/votacao) ---

test("sem config/votacao definido, a votacao fica aberta", async () => {
  await assertSucceeds(
    publico().doc("votos_fotos/12345678901").set({ participanteId: "p1", nome: "Fulano", timestamp: new Date() })
  );
});

test("bloqueia voto depois do prazo de encerramento", async () => {
  const ontem = new Date(Date.now() - 24 * 60 * 60 * 1000);
  await seed("config/votacao", { encerramento: ontem });

  await assertFails(
    publico().doc("votos_fotos/12345678901").set({ participanteId: "p1", nome: "Fulano", timestamp: new Date() })
  );
});

test("permite voto antes do prazo de encerramento", async () => {
  const amanha = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await seed("config/votacao", { encerramento: amanha });

  await assertSucceeds(
    publico().doc("votos_fotos/12345678901").set({ participanteId: "p1", nome: "Fulano", timestamp: new Date() })
  );
});

test("qualquer um le o prazo, so o admin altera", async () => {
  await seed("config/votacao", { encerramento: new Date() });
  await assertSucceeds(publico().doc("config/votacao").get());
  await assertFails(publico().doc("config/votacao").set({ encerramento: new Date() }));
  await assertSucceeds(admin().doc("config/votacao").set({ encerramento: new Date() }));
});
