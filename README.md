# Pedro Egerland — Portfólio / Portfolio

🇧🇷 Site pessoal bilíngue (português e inglês) com projetos, experiência, habilidades e contato.
Publicado em **https://pedroegerland.github.io/portfolio/** via GitHub Pages.

🇬🇧 Bilingual (Portuguese/English) personal site with projects, experience, skills and contact.
Published at **https://pedroegerland.github.io/portfolio/** through GitHub Pages.

## Como funciona / How it works

- HTML, CSS e JavaScript puros — sem build, sem dependências. / Plain HTML, CSS and JS — no build step, no dependencies.
- Todo o conteúdo fica em [`data.js`](data.js) com campos `{ pt, en }`; [`app.js`](app.js) renderiza e troca o idioma
  (`?lang=pt|en`, salvo em `localStorage`, padrão pelo idioma do navegador). / All content lives in `data.js` as `{ pt, en }`
  fields; `app.js` renders it and switches language.
- Capturas de tela em [`assets/projects/`](assets/projects/) foram tiradas das aplicações rodando localmente. / Screenshots
  were taken from the applications running locally.
- Deploy automático pelo workflow [`pages.yml`](.github/workflows/pages.yml) a cada push em `main`. / Deployed automatically
  on every push to `main`.

## Projetos em destaque / Featured projects

| Projeto | Stack | Repositório |
|---------|-------|-------------|
| Karen Clemente Ateliê | Go + React monolith, Firestore, Cloud Run | [karenclementeatelie](https://github.com/pedroegerland/karenclementeatelie) |
| Imobiliária Marques & Henriques | React/TS, Go Lambdas, DynamoDB, Cognito, SAM | [imobiliaria-marques-e-henriques](https://github.com/pedroegerland/imobiliaria-marques-e-henriques) |
| Cantina | Flutter, Firebase Auth/Firestore/Storage | [cafeteria](https://github.com/pedroegerland/cafeteria) |
| WatchMyKidPhone | Go hexagonal, DynamoDB, CDK, React Native, Kotlin/Swift | em desenvolvimento / in progress |

## Rodar localmente / Run locally

```bash
python3 -m http.server 4173
# http://localhost:4173
```

## Licença / License

Código sob [MIT](LICENSE). Textos, imagens e marcas dos projetos pertencem aos respectivos donos. /
Code under MIT; project texts, images and brands belong to their owners.
