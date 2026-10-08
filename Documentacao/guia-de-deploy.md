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
2. Crie primeiro o projeto do Portal e copie a URL gerada. No projeto do Site, cadastre `PORTAL_URL` **antes** do deploy: sem ela o build do site falha. Depois preencha `NEXT_PUBLIC_SITE_URL` nos dois e faça *Redeploy*.
3. `SUPABASE_SECRET_KEY` e `DATABASE_URL` **não** vão para a Vercel.

## 3. Supabase

As migrações (`Aplicativo/supabase/migrations/0001_inicial.sql` e `0002_cadastro_e_aprovacao.sql`) são aplicadas em ordem. Depois:

1. **SQL Editor:** cadastre o e-mail do administrador (em qualquer ordem: um usuário com esse e-mail **e e-mail confirmado** fica ativo). Se já existir um usuário com esse e-mail que você não criou, apague-o; não o confirme.
   ```sql
   insert into public.administradores (email) values ('<email-do-admin>');
   ```
2. **Authentication → Users → Add user:** crie o administrador com o mesmo e-mail de `ADMIN_USUARIO` e uma senha forte (marque *Auto Confirm User*).
3. **Authentication → Sign In / Providers:**
   - *Email*: ativo, com **Confirm email** ligado e senha mínima de 10 caracteres;
   - *Google*: ativo, com Client ID e Client Secret.
4. **Authentication → URL Configuration:**
   - *Site URL* = URL do portal na Vercel;
   - *Redirect URLs* = `https://<portal>/auth/callback` e `https://<portal>/auth/confirmar**`.
5. **Authentication → Emails → Templates:** nos modelos *Confirm signup* e *Reset Password*, troque o link por
   `{{ .SiteURL }}/auth/confirmar?token_hash={{ .TokenHash }}&type=email` (cadastro) e
   `{{ .SiteURL }}/auth/confirmar?token_hash={{ .TokenHash }}&type=recovery` (nova senha).
   O link leva a uma página com um botão; o token só é usado no clique, para que antivírus de e-mail não o consumam.
6. **Authentication → Emails → SMTP Settings:** configure um SMTP próprio. O SMTP padrão só envia para membros do projeto.
7. **Authentication → Hooks:** o *Before User Created* deve ficar **desligado** antes de aplicar a 0002 (a função antiga é removida; com o hook ligado, todo cadastro falha).
8. **Authentication → Multi-Factor:** ative TOTP (recomendado para o admin).
9. **Project Settings → API Keys:** crie uma *secret key* (`sb_secret_...`) para o script de indicadores (`.env` local e secret do GitHub).

## 4. Google Cloud Console (projeto do Client ID)

1. **APIs e serviços → Biblioteca:** ative Google Sheets API, Google Drive API, Google Calendar API e Gmail API.
2. **Google Auth Platform → Branding:** em *Domínios autorizados*, inclua `supabase.co` e `vercel.app` (ou o domínio próprio).
3. **Google Auth Platform → Acesso a dados:** adicione os escopos
   `openid`, `email`, `profile`, `.../auth/drive.file`, `.../auth/calendar.events.readonly`, `.../auth/gmail.compose`.
4. **Clientes → cliente Web:**
   - Origens JavaScript autorizadas = URL do portal;
   - URIs de redirecionamento autorizados = `https://<projeto>.supabase.co/auth/v1/callback` (a mesma para o site e o portal).
5. Em modo *Testing*, só os usuários de teste entram com Google e o refresh token expira em 7 dias. Para abrir o Google a qualquer pessoa é preciso publicar o app, o que exige verificação do Google por causa do escopo do Gmail. O cadastro por e-mail funciona sem isso.

## 5. Carga dos indicadores

Automática: a Action **Carga de indicadores** roda de segunda a sexta às 9h (Brasília) e pode ser disparada em *Actions → Carga de indicadores → Run workflow*. Ela usa os secrets `SUPABASE_URL` e `SUPABASE_SECRET_KEY` do repositório.

Manual, com `SUPABASE_URL` e `SUPABASE_SECRET_KEY` no `.env` da raiz:

```bash
python Aplicativo/scripts/indicadores/indicadores_brasil.py
```

Rode de novo sempre que quiser atualizar (o *upsert* não duplica). Os CSVs ficam em `Aplicativo/scripts/indicadores/saida/` (não versionados).

## 6. GitHub

- **CI** (`.github/workflows/ci.yml`): em cada PR e na `main`, roda lint, tipos, testes e build do Aplicativo e do Website, os testes do script Python e a varredura de segredos (gitleaks). A `main` exige esses checks para o merge.
- **Dependabot** abre PRs semanais de atualização (npm e Actions).

## 7. Conferência final

- Criar conta com e-mail → e-mail de confirmação → tela "Cadastro recebido" (pendente).
- Admin aprova em *Usuários → Aguardando aprovação* → o usuário entra no portal.
- Entrar com Google (conta nova) → também fica pendente até a aprovação.
- "Esqueci minha senha" → link → nova senha → entra no portal.
- Admin entra com e-mail e senha e vê "Administração"; o mesmo e-mail pelo Google **não** vê.
- Bloquear um usuário → ele vê "Acesso não autorizado".
- Site: "Entrar" e "Criar conta" no cabeçalho levam ao portal; o Termômetro aparece.
- Gerar relatório (login Google) → Planilha no Drive, Excel e rascunho no Gmail (sem envio).
- PWA: Lighthouse na URL da Vercel, instalação no Android/iPhone/desktop, modo avião mostra o aviso offline.
