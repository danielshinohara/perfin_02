---
paths:
  - "**/*.{tsx,jsx,ts,js}"
---

# React / Next.js

## Componentes

- Use apenas componentes funcionais e hooks. Nada de componentes de classe.
- Um componente por arquivo, com nome em PascalCase igual ao nome do arquivo (`ResumoFinanceiro.tsx`).
- Componentes pequenos e com uma responsabilidade. Se um componente faz muitas coisas, divida.
- Separe componentes de apresentação (só exibem dados recebidos por props) de componentes que buscam dados.
- Use TypeScript e tipe as props. Evite `any`.

## Next.js (App Router)

- Por padrão, componentes são Server Components. Só use `"use client"` quando precisar de interatividade, estado ou APIs do navegador, e o mais "embaixo" possível na árvore.
- Busque dados no servidor (Server Components, Route Handlers ou Server Actions), não com `useEffect` no cliente, sempre que possível.
- Use `next/link` para navegação, `next/image` para imagens e `next/font` para fontes.
- Use os arquivos especiais do App Router para estados de tela: `loading.tsx`, `error.tsx` e `not-found.tsx`.
- Defina `metadata` (título e descrição) em cada página.

## Estado e efeitos

- Mantenha o estado o mais local possível. Só eleve ou globalize quando realmente for compartilhado.
- Não guarde em estado o que pode ser calculado a partir de props ou de outro estado.
- Use `useEffect` só para sincronizar com algo externo. Sempre declare as dependências corretamente e faça a limpeza (cleanup) quando necessário.
- Listas renderizadas com `map` usam uma `key` estável e única (nunca o índice, se a lista puder mudar).

## Dados e segurança

- Chaves secretas e a conexão direta com o banco (`DATABASE_URL`) nunca vão para o código do cliente. No navegador, só variáveis `NEXT_PUBLIC_*` e a chave publicável do Supabase.
- Acesso ao Supabase fica centralizado em um módulo de serviço, não espalhado pelos componentes.
- Valide no servidor qualquer dado vindo do usuário, mesmo que já tenha sido validado no formulário.
- Regras de negócio ficam fora dos componentes (ver `.claude/rules/architecture.md`).

## Organização e qualidade

- Hooks customizados começam com `use` e ficam em arquivos próprios quando reutilizados.
- Evite "prop drilling" profundo; prefira composição (`children`) ou contexto quando fizer sentido.
- Não deixe `console.log`, código comentado ou imports sem uso.
- Não otimize antes da hora: use `useMemo`/`useCallback`/`memo` só quando houver um problema real de desempenho.
