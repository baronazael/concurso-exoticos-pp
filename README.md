# Concurso Melhor Foto/Vídeo — 3º Encontro de Super Máquinas (Rocha Motors)

Galeria pública (Fotos + Vídeos) com votação embutida (1 voto por CPF por categoria) e painel admin. Front-end estático no GitHub Pages; dados/votos/auth no Firebase.

## Setup inicial (uma vez só)

1. **Criar projeto Firebase**: https://console.firebase.google.com > Adicionar projeto.
2. **Ativar Firestore**: Build > Firestore Database > Criar banco (modo produção).
3. **Ativar Storage**: Build > Storage > Começar (modo produção).
4. **Ativar Authentication**: Build > Authentication > Sign-in method > ativar "E-mail/senha".
5. **Criar o usuário admin**: Authentication > Users > Add user (seu e-mail + senha). Copie o **UID** gerado.
6. **Colar o UID do admin** em 3 arquivos, substituindo `COLE_O_UID_DO_ADMIN_AQUI`:
   - `firestore.rules`
   - `storage.rules`
   - `admin.js`
7. **Pegar as chaves do app web**: Configurações do projeto > Seus apps > Web (`</>`) > copiar o `firebaseConfig` pra dentro de `lib/firebase-config.js`.
8. **Publicar as regras**:
   ```
   npm install -g firebase-tools
   firebase login
   firebase deploy --only firestore:rules,storage:rules
   ```
9. **Popular participantes**: abrir `admin.html`, logar, aba Participantes > "Criar 18 fotos + 6 vídeos padrão". Depois editar nome, subir foto ou colar ID do YouTube em cada um.

## Como editar depois

Tudo pelo `admin.html` (não mexe mais em código):
- Editar/adicionar/remover participante, trocar foto ou vídeo.
- Ver contagem de votos por participante (não aparece na página pública, só aqui).
- Ver lista de votantes (nome + CPF + em quem votou + quando) e exportar CSV.

## Sobre a validação de voto

- Cada voto exige nome completo + CPF (checksum validado no navegador antes de enviar).
- O Firestore usa o **CPF normalizado como ID do documento** e só permite criar (nunca atualizar/apagar) — é isso que impede o mesmo CPF votar 2x na mesma categoria.
- Fotos e Vídeos são categorias independentes: o mesmo CPF pode votar 1x em cada.
- A contagem de votos **não é legível publicamente** — a regra do Firestore só libera leitura da coleção de votos pro UID do admin.
- **Limitação conhecida**: a linguagem de regras do Firestore não roda o cálculo completo do dígito verificador do CPF (não tem loop). O checksum completo é validado no cliente; o servidor só garante formato de 11 dígitos + unicidade. Alguém manipulando a API diretamente (fora da interface) poderia burlar o checksum, mas não conseguiria votar 2x com o mesmo número nem ler a contagem. Fechar esse último gap exigiria Cloud Functions (plano pago Blaze) — avise se quiser evoluir pra isso depois.

## Testes automatizados

```
cd tests
npm install
firebase emulators:exec --only firestore "npm test"
```

Cobre: CPF válido/inválido/formatação (`cpf.test.js`), e as regras de segurança — dedup de voto, bloqueio de leitura pública, escrita de participantes restrita ao admin (`rules.test.js`).

## Checklist de QA manual (rodar antes de divulgar o link)

- [ ] Abrir o site no celular real (não só redimensionar desktop) — Fotos e Vídeos.
- [ ] Votar com um CPF válido em uma foto → aparece "Voto registrado".
- [ ] Tentar votar de novo com o **mesmo CPF** (outra foto, mesma categoria) → deve dar erro "já votou".
- [ ] Votar com o mesmo CPF na categoria de Vídeos → deve funcionar (categoria independente).
- [ ] Tentar votar com CPF inválido (ex: 111.111.111-11) → deve barrar antes de enviar.
- [ ] Conferir que a página pública **não mostra nenhum número de votos** em nenhum lugar.
- [ ] Logar no `admin.html` e conferir que a contagem bate com os votos de teste feitos.
- [ ] Testar edição de participante (trocar nome, trocar foto) e ver refletir na página pública sem precisar dar deploy.
- [ ] Testar remover um participante e confirmar que some da página pública.
- [ ] Exportar CSV da lista de votantes e abrir pra conferir que os dados batem.
- [ ] Testar login errado no admin (senha errada) → mensagem de erro, não trava a página.

## Publicar no GitHub Pages

```
git add .
git commit -m "conteudo do concurso"
git push
```

No GitHub: Settings > Pages > Branch `main` > pasta `/root`.
