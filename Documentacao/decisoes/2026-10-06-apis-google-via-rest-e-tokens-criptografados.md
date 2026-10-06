# APIs do Google via REST e refresh token criptografado

- **Data:** 06/10/2026
- **Status:** aceita

## Contexto

O portal cria planilhas (Sheets/Drive), lê a agenda (Calendar) e cria rascunhos (Gmail) em nome do usuário. O Supabase entrega o `provider_refresh_token` só no retorno do login e não o renova.

## Decisão

- Chamar as APIs do Google com `fetch` em módulos pequenos (`src/lib/google/`), sem o pacote `googleapis`.
- Pedir `access_type=offline` e `prompt=consent` no login e guardar o refresh token **criptografado com AES-256-GCM** (`TOKEN_ENCRYPTION_KEY`) na tabela `google_tokens`, protegida por RLS (só o dono).
- Gerar um access token novo a cada operação; se o Google recusar (`invalid_grant`), apagar o token e pedir novo login.
- Escopos mínimos: `drive.file` (só arquivos do app), `calendar.events.readonly` e `gmail.compose` (menor escopo que permite rascunho). O código só chama `drafts.create`; um teste impede endpoints de envio.

## Alternativas consideradas

- **Pacote `googleapis`:** cobre tudo, mas é muito grande para cinco chamadas.
- **Guardar o token em texto puro:** um vazamento do banco daria acesso às contas Google; descartada.
- **Gerar o Excel com biblioteca própria (ex.: exceljs):** a exportação do Drive já entrega o `.xlsx` sem dependência nova.

## Consequências

- Menos dependências e superfície de ataque.
- Em modo *Testing* no Google, o refresh token expira em 7 dias e o usuário precisa entrar de novo.
