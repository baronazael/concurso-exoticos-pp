# Concurso @exoticos_pp

Página de votação: galeria de fotos e vídeos das inscrições.

## Como atualizar

Editar `data.js`:

- **Fotos**: trocar `participante` pelo nome real e colocar o arquivo (`.jpg`/`.png`) dentro da pasta `fotos/` com o mesmo nome do campo `arquivo` (ex: `fotos/foto-1.jpg`). A página detecta e mostra sozinha, sem precisar mexer no código.
- **Vídeos**: colar o ID do vídeo do YouTube (não-listado) no campo `youtubeId`. O ID é a parte final do link, ex: `https://youtu.be/ABC123xyz` → `youtubeId: "ABC123xyz"`.
- **Link do Forms**: preencher `LINK_FORMS_FOTOS` e `LINK_FORMS_VIDEOS` quando os formulários de votação estiverem prontos.

## Publicar no GitHub Pages

```
git add .
git commit -m "conteudo do concurso"
git push
```

Depois, no repositório do GitHub: Settings > Pages > Branch `main` > pasta `/root`.
