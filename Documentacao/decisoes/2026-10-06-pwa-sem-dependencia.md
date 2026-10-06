# PWA com service worker próprio

- **Data:** 06/10/2026
- **Status:** aceita

## Contexto

O portal deve ser instalável (celular e desktop) e funcionar com conexão ruim, sem expor dados sensíveis em cache.

## Decisão

- Manifesto nativo do Next (`app/manifest.ts`) e service worker próprio servido por `/sw.js` com a versão do deploy da Vercel (dispara o aviso de nova versão).
- Estratégias: estáticos *cache-first*; páginas de dados *network-first* (cache só offline); login, APIs, relatórios, agenda, assistente e admin somente rede; cache de páginas apagado ao sair.
- A estratégia original do plano era *stale-while-revalidate* para as páginas de dados; trocamos por *network-first* para nunca mostrar dados antigos quando há conexão.

## Alternativas consideradas

- **next-pwa / Serwist:** resolvem casos amplos, mas adicionam dependência e configuração para um caso simples.

## Consequências

- Controle total do que vai para o cache (testado em `codigo-sw.test.ts`).
- Notificações push ficam para uma evolução futura.
