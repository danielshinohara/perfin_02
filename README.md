# Perfin_02

Projeto da Perfin (gestão de ativos) composto por aplicativo, website e documentação.

## Estrutura

| Pasta | Conteúdo |
|---|---|
| `Aplicativo/` | Portal Perfin: PWA Next.js + Supabase (painéis, insights, relatórios, agenda, assistente) e script de indicadores |
| `Website/` | Site público com o Termômetro da economia |
| `Documentacao/` | Documentação, especificações e decisões do projeto |
| `.claude/` | Configuração do Claude Code: `CLAUDE.md`, subagentes e skills (versionada) |

## Primeiros passos

```bash
git clone https://github.com/danielshinohara/perfin_02.git
cd perfin_02
cp .env.example .env   # preencha com os valores reais
```

## Configuração

As variáveis de ambiente ficam em `.env` (não versionado). Use `.env.example` como modelo. O backend de dados é o **Supabase** (PostgreSQL) e a publicação é na **Vercel** (dois projetos: `Aplicativo` e `Website`).

Passo a passo completo em [Documentacao/guia-de-deploy.md](Documentacao/guia-de-deploy.md); regras de negócio em [Documentacao/regras-de-negocio.md](Documentacao/regras-de-negocio.md).

## Claude Code

A pasta `.claude/` faz parte do repositório e traz:

- `CLAUDE.md` — orientações do projeto para o Claude Code;
- `settings.json` e `hooks/` — permissões e hooks de proteção do projeto;
- `rules/` — regras de código, frontend, idioma, segurança e testes;
- `agents/` — subagentes `architect`, `frontend`, `tester` e `reviewer`;
- `skills/` — skills `nova-funcionalidade`, `corrigir-bug`, `documentar-projeto` e `revisar-entrega`.

Configurações pessoais (`.claude/settings.local.json`) não são versionadas.

## Convenções

- Idioma: português (pt-BR); números `1.234,56` e datas `DD/MM/AAAA`.
- Identidade visual Perfin em todos os entregáveis.
