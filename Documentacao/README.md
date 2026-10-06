# Documentação — Perfin_02

| Documento | Descrição |
|---|---|
| [portal-perfin.md](portal-perfin.md) | O que é o Portal Perfin e o Website, perfis, arquitetura, PWA, comandos e limitações |
| [regras-de-negocio.md](regras-de-negocio.md) | Indicadores, fórmulas, insights/alertas e conteúdo do relatório do mês |
| [guia-de-deploy.md](guia-de-deploy.md) | Passo a passo: credenciais, Vercel, Supabase, Google Cloud e carga de dados |

## Decisões

| Decisão | Resumo |
|---|---|
| [Autenticação e papel por método](decisoes/2026-10-06-autenticacao-supabase-papel-por-metodo.md) | Supabase Auth; admin = e-mail do admin + login por senha |
| [APIs Google via REST e tokens criptografados](decisoes/2026-10-06-apis-google-via-rest-e-tokens-criptografados.md) | `fetch` sem `googleapis`; refresh token em AES-256-GCM; Gmail só rascunho |
| [Dados públicos e Website](decisoes/2026-10-06-dados-publicos-e-website.md) | `anon` lê só indicadores públicos; site consome a API do portal |
| [PWA sem dependência](decisoes/2026-10-06-pwa-sem-dependencia.md) | Service worker próprio; nada sensível em cache |
