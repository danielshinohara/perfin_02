# Autenticação com Supabase Auth e papel pelo método de login

- **Data:** 06/10/2026
- **Status:** aceita

## Contexto

O portal tem dois perfis: usuários que entram com Google (e precisam de acesso a Drive, Agenda e Gmail) e um administrador que entra com usuário e senha. O banco é o Supabase, com RLS obrigatório.

## Decisão

- Usar **Supabase Auth** para os dois métodos (provedor Google e e-mail/senha), com `@supabase/ssr` no Next.js.
- O papel **admin** exige e-mail igual a `ADMIN_USUARIO` (app) / presente em `administradores` (banco) **e** sessão aberta com senha (`amr` contém `password`). O mesmo e-mail pelo Google é usuário.
- A senha do admin fica com hash no Supabase Auth, não no código nem comparada ao `.env`.
- Hook *Before User Created* rejeita novos cadastros por e-mail e senha.

## Alternativas consideradas

- **Auth.js (NextAuth):** gerencia tokens do Google, mas não se integra ao RLS (`auth.uid()`), obrigando a usar a chave secreta no app.
- **Comparar senha com `ADMIN_SENHA` no código:** sem hash, sem limite de tentativas e com segredo em variável de ambiente; descartada.

## Consequências

- RLS nativo em todas as tabelas, sem chave secreta no app.
- A sessão de admin não tem token do Google: Agenda, Planilha e Gmail ficam indisponíveis nela.
- Cadastro do admin é manual no painel do Supabase.
