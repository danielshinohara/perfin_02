# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## O que é este workspace

Projeto **Perfin_02** da Perfin (gestão de ativos). Idioma de trabalho: português (pt-BR).

- `Aplicativo/` — código e protótipos do aplicativo.
- `Website/` — código e conteúdo do site.
- `Documentacao/` — documentação, especificações e decisões (`Documentacao/decisoes/`).

## Stack e comandos

- `Aplicativo/` — Portal Perfin (Next.js 16 + TypeScript, App Router, PWA), Supabase e Vercel. Regras de negócio em `src/lib/dominio/`.
- `Website/` — site público (Next.js), lê a API pública do portal.
- `Aplicativo/scripts/indicadores/` — script Python (só biblioteca padrão) que coleta BCB/IBGE/Focus e grava no Supabase.
- `Aplicativo/supabase/migrations/` — esquema do banco, RLS e dados iniciais.
- Node.js 24 LTS (instalado via winget no Windows). Gerenciador: npm. Testes: Vitest (TS) e unittest (Python).

Em `Aplicativo/` ou `Website/`:

| Ação | Comando |
|---|---|
| Lint | `npm run lint` |
| Tipos | `npm run typecheck` |
| Todos os testes | `npm test` |
| Um único teste | `npx vitest run src/lib/dominio/inflacao.test.ts` |
| Build | `npm run build` |

Script Python (em `Aplicativo/scripts/indicadores/`): testes `python -m unittest`; coleta `python indicadores_brasil.py` (ou `--sem-supabase` para só gerar CSV).

O sistema roda sempre pela URL da Vercel (`NEXT_PUBLIC_SITE_URL`); não há servidor em localhost. Documentação em `Documentacao/` (comece por `Documentacao/README.md`).

## Estrutura do `.claude/`

| Item | Papel |
|---|---|
| `rules/` | Regras permanentes do projeto, carregadas automaticamente. `frontend.md` só carrega ao trabalhar com arquivos de interface. |
| `agents/` | Subagentes: especialistas que trabalham em contexto isolado e devolvem um relatório. |
| `skills/` | Processos reutilizáveis, acionados por `/nome` ou quando o pedido se encaixa. |
| `hooks/` + `settings.json` | Ações obrigatórias, executadas automaticamente em eventos. |
| `logs/alteracoes.log` | Registro de cada arquivo alterado (gerado por hook). |

### Subagentes

- `architect` — analisa requisitos e arquitetura; entrega impacto, arquivos, riscos e plano. Somente leitura.
- `frontend` — implementa interfaces React/Next.js seguindo os padrões existentes.
- `tester` — analisa a implementação e cria testes (edge cases, regressões, erros de estado).
- `reviewer` — code review rigoroso (bugs, duplicação, segurança, complexidade, código morto). Somente leitura.

### Skills

- `nova-funcionalidade` — architect → implementação → tester → reviewer → documentação → entrega.
- `corrigir-bug` — reproduzir com teste, corrigir a causa raiz, revisar.
- `documentar-projeto` — registrar decisões e documentação em `Documentacao/`.
- `revisar-entrega` — checklist final antes de entregar.

### Hooks e bloqueios

- **Antes de editar arquivos** — `proteger-arquivos.ps1` bloqueia a edição de segredos (`.env`, chaves, certificados), de `.git/` e de lockfiles.
- **Antes de comandos de terminal** — `bloquear-comandos-perigosos.ps1` bloqueia comandos destrutivos (`rm -rf /`, `git push --force`, `git reset --hard`, `DROP TABLE`, `curl ... | sh` etc.).
- **Depois de editar arquivos** — `registrar-alteracoes.ps1` registra o arquivo em `.claude/logs/alteracoes.log`.
- **Leitura de segredos** — negada por `permissions.deny` em `settings.json`.

Os hooks são scripts PowerShell (Windows), salvos em UTF-8 com BOM para preservar os acentos no Windows PowerShell 5.1. Se um hook bloquear algo necessário, peça ao usuário para executar a ação; não contorne o hook.

## Fluxo de trabalho

- Funcionalidade nova ou mudança em mais de um arquivo: skill `nova-funcionalidade`.
- Bug: skill `corrigir-bug`.
- Antes de declarar qualquer tarefa concluída: skill `revisar-entrega`.
