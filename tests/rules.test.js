import { test, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from "@firebase/rules-unit-testing";

// Mesmo valor que esta escrito em firestore.rules como placeholder do admin.
// O teste so verifica a LOGICA da regra (uid bate/nao bate) - nao importa
// que na producao voce troque essa string pelo UID real do admin.
const ADMIN_UID = "COLE_O_UID_DO_ADMIN_AQUI";
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
