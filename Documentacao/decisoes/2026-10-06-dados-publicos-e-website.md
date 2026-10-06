# Leitura anônima de dados públicos e Website consumindo a API do portal

- **Data:** 06/10/2026
- **Status:** aceita

## Contexto

O site público mostra um "Termômetro da economia" sem login, com os mesmos cálculos do portal. As regras do projeto proíbem políticas RLS permissivas (`using (true)`).

## Decisão

- Coluna `publico` no catálogo `indicadores`. O papel `anon` lê só indicadores com `publico = true` e seus valores (dados públicos do BCB/IBGE). Metas de inflação via função `metas_inflacao_publicas()`.
- O Website **não acessa o banco**: lê `GET /api/publico/termometro` do Aplicativo, que calcula KPIs, gráficos e até 3 insights informativos, com cache de 1 hora na CDN.

## Alternativas consideradas

- **Website lendo o Supabase direto:** duplicaria os cálculos no site.
- **Monorepo com pacote compartilhado:** mais configuração e build mais complexo para pouco ganho agora.

## Consequências

- Uma única fonte de cálculo (domínio do Aplicativo).
- O site depende do portal estar no ar; em falha, mostra "indicadores temporariamente indisponíveis".
