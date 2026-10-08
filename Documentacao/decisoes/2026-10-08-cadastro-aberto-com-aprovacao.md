# Cadastro aberto (e-mail/senha ou Google) com aprovação do admin

- **Data:** 08/10/2026
- **Status:** aceita (substitui o hook de cadastro da decisão "Autenticação e papel por método")

## Contexto

O site precisa de "Entrar / Criar conta" no canto superior direito, com e-mail e senha ou conta Google, valendo para o site e para o portal. O site e o portal ficam em domínios diferentes na Vercel; cookies de sessão não passam de um domínio para o outro.

## Decisão

- **Uma única tela de login, no portal.** Os botões do site levam a `PORTAL_URL/login` e `PORTAL_URL/login?modo=cadastro`. Há uma só sessão (no domínio do portal) e o site continua sem acesso ao banco.
- **Cadastro aberto, acesso só com aprovação.** Qualquer pessoa cria conta (e-mail confirmado ou Google). O perfil nasce `pendente` e só acessa os dados quando o admin muda para `ativo`. `perfis.situacao` (`pendente | ativo | bloqueado`) substitui `bloqueado`.
- **O admin altera a situação só pela função `definir_situacao_usuario`**, que exige `eh_admin()`, impede alterar a si mesmo e registra quem e quando.
- **O papel continua decidido pelo método de login:** admin = e-mail em `administradores` (e `ADMIN_USUARIO`) **e** sessão com senha. Usuários comuns também podem usar senha agora, mas não estão em `administradores`.
- **Sai o hook** *Before User Created* (`hook_restringir_cadastro`).
- **Links de e-mail** (confirmação e nova senha) chegam em `/auth/confirmar`, que aceita `token_hash` (funciona em qualquer aparelho) e `code` (modelo padrão do Supabase).
- **A URI de redirecionamento do Google é a do Supabase** (`https://<projeto>.supabase.co/auth/v1/callback`), a mesma para o site e para o portal.

## Alternativas consideradas

- **Login próprio no site:** exigiria uma segunda sessão (ou passagem de sessão entre domínios) e acesso do site ao Supabase; descartada.
- **Unir site e portal no mesmo domínio:** resolveria o cookie, mas é uma reestruturação grande; fica como evolução.
- **Cadastro só por convite:** mais fechado, mas não atende "Criar conta" no site.

## Consequências

- O envio de e-mails (confirmação, nova senha) depende de um SMTP próprio no Supabase; o SMTP padrão só envia para membros do projeto.
- Quem entra com senha não tem token do Google: Relatórios, Agenda e Gmail pedem "Entrar com Google".
- Para o Google funcionar para qualquer pessoa, o app OAuth precisa sair do modo *Testing*; com o escopo do Gmail (restrito), isso exige verificação do Google.
