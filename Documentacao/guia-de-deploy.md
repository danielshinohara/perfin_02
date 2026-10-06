# Guia de deploy e configuração

Passo a passo para colocar o Portal Perfin (Aplicativo) e o Website no ar. O sistema roda **sempre pela URL da Vercel** — não há uso de localhost.

## 1. Antes de tudo: credenciais

1. Passe os valores do arquivo `DadosPerfin.txt` para o `.env` (modelo em `.env.example`) e **apague o `DadosPerfin.txt`**.
2. Gere novas credenciais, pois as atuais ficaram em texto puro numa pasta sincronizada com o OneDrive:
   - Google Cloud: novo *client secret* do OAuth (desative o antigo);
   - Google AI Studio: nova chave do Gemini;
   - Supabase: nova senha do banco (*Project Settings → Database*);
   - senha forte para o administrador (definida no passo 3.2).
3. Gere a `TOKEN_ENCRYPTION_KEY`:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

## 2. Vercel (dois projetos no mesmo repositório)

| Projeto | Root Directory | Variáveis (Production) |
|---|---|---|
| Portal Perfin | `Aplicativo` | `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `ADMIN_USUARIO`, `GEMINI_API_KEY`, `TOKEN_ENCRYPTION_KEY` |
| Site Perfin | `Website` | `NEXT_PUBLIC_SITE_URL` (URL do site), `PORTAL_URL` (URL do portal) |

1. Importe `danielshinohara/perfin_02` duas vezes (uma por projeto), framework Next.js.
2. Após o primeiro deploy, copie as URLs geradas, preencha `NEXT_PUBLIC_SITE_URL`/`PORTAL_URL` e faça *Redeploy*.
3. `SUPABASE_SECRET_KEY` e `DATABASE_URL` **não** vão para a Vercel.

## 3. Supabase

1. **SQL Editor:** cole e rode `Aplicativo/supabase/migrations/0001_inicial.sql`. Depois:
   ```sql
   insert into public.administradores (email) values ('<email-do-admin>');
   ```
2. **Authentication → Users → Add user:** crie o administrador com o mesmo e-mail de `ADMIN_USUARIO` e uma senha forte (marque *Auto Confirm User*).
3. **Authentication → Sign In / Providers:**
   - *Email*: ativo (login do admin);
   - *Google*: ativo, com Client ID e o **novo** Client Secret. Copie a *Callback URL* (`https://<projeto>.supabase.co/auth/v1/callback`).
4. **Authentication → URL Configuration:**
   - *Site URL* = URL do portal na Vercel;
   - *Redirect URLs* = `https://<portal>.vercel.app/auth/callback`.
5. **Authentication → Hooks:** ative *Before User Created* → função `public.hook_restringir_cadastro` (depois do passo 2). Ela impede novos cadastros por e-mail e senha.
6. **Authentication → Multi-Factor:** ative TOTP (recomendado para o admin).
7. **Project Settings → API Keys:** crie uma *secret key* (`sb_secret_...`) para o script de indicadores e coloque em `SUPABASE_SECRET_KEY` no `.env` local.

## 4. Google Cloud Console (projeto do Client ID)

1. **APIs e serviços → Biblioteca:** ative Google Sheets API, Google Drive API, Google Calendar API e Gmail API.
2. **Google Auth Platform → Acesso a dados:** adicione os escopos
   `openid`, `email`, `profile`, `.../auth/drive.file`, `.../auth/calendar.events.readonly`, `.../auth/gmail.compose`.
3. **Clientes → cliente Web:**
   - Origens JavaScript autorizadas = URL do portal;
   - URIs de redirecionamento autorizados = Callback URL do Supabase (passo 3.3).
4. Se o app estiver em modo *Testing*, o refresh token do Google expira em 7 dias: a cada semana o usuário precisará entrar de novo com Google para usar Agenda, Planilha e Gmail.

## 5. Carga dos indicadores

Com `SUPABASE_URL` e `SUPABASE_SECRET_KEY` no `.env` da raiz:

```bash
python Aplicativo/scripts/indicadores/indicadores_brasil.py
```

Rode de novo sempre que quiser atualizar (o *upsert* não duplica). Os CSVs ficam em `Aplicativo/scripts/indicadores/saida/` (não versionados).

## 6. Conferência final

- Login com Google (usuário) e com e-mail e senha (admin, vê "Administração").
- O mesmo e-mail pelo Google **não** vê as telas de admin.
- Bloquear um usuário em *Usuários* → ele vê "Acesso não autorizado".
- Gerar relatório → Planilha no Drive, download do Excel e rascunho no Gmail (sem envio).
- Site mostra o Termômetro (lê `PORTAL_URL/api/publico/termometro`).
- PWA: Lighthouse na URL da Vercel, instalação no Android/iPhone/desktop, modo avião mostra o aviso offline.
