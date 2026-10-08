# Portal Perfin (Aplicativo) e Website

## O que é

- **Aplicativo (`Aplicativo/`)** — PWA instalável com login. Painéis (Visão geral, Inflação, Juros, Câmbio, Atividade, Expectativas), calculadora de correção, relatório do mês (Planilha Google, Excel, rascunho no Gmail), agenda do Google, assistente com Gemini e administração (usuários e alertas).
- **Website (`Website/`)** — site público com o "Termômetro da economia" e links para o portal. Lê a API pública `GET /api/publico/termometro` do Aplicativo (cache de 1 hora); não acessa o banco.
- **Script (`Aplicativo/scripts/indicadores/`)** — coleta BCB/IBGE/Focus, grava no Supabase e gera CSVs.

## Perfis de acesso

| Perfil | Como entra | Pode |
|---|---|---|
| Usuário | "Continuar com Google" ou e-mail e senha (aba *Entrar*) | painéis, calculadora, assistente; relatórios e agenda só com login Google |
| Administrador | e-mail de `ADMIN_USUARIO` + senha (aba *Entrar*) | tudo do usuário (exceto recursos Google) + Usuários e Alertas |

- **Entrar / Criar conta:** a tela fica no portal (`/login`, `/login?modo=cadastro`); os botões do cabeçalho do site levam para ela. Há uma única sessão, no domínio do portal.
- **Cadastro:** aberto (e-mail confirmado ou Google). A conta nasce **aguardando aprovação** (`perfis.situacao = 'pendente'`) e vê a tela "Cadastro recebido" até o admin aprovar em *Usuários*. O e-mail que está em `administradores` já nasce ativo.
- **Situações:** `pendente` → `/aguardando-aprovacao`; `ativo` → portal; `bloqueado` → "Acesso não autorizado". O admin muda a situação pela função `definir_situacao_usuario` (registra quem e quando).
- **Links de e-mail:** `/auth/confirmar` leva a `/conta/confirmar` (botão; o token só é usado no clique). Recuperação de senha: `/login/recuperar` → link → `/conta/nova-senha`, que só aceita sessão aberta pelo link há até 15 minutos (uma sessão do Google não consegue criar senha e virar admin).
- **Aprovação:** só contas com e-mail confirmado podem ser aprovadas (regra também no banco).
- **Papel:** decidido pelo método de login (`amr` do JWT): admin só com senha **e** e-mail em `administradores`. A checagem existe no servidor (`lib/auth/papel.ts`) e no banco (`public.eh_admin()` no RLS).

## Arquitetura (resumo)

```
src/lib/dominio/   regras de negócio puras (cálculos, insights, filtros, formatos, conteúdo do relatório)
src/lib/servicos/  Supabase (com a sessão do usuário, sob RLS) e orquestração
src/lib/google/    Sheets, Drive, Calendar, Gmail via REST (fetch)
src/lib/gemini/    assistente
src/app/           páginas e rotas (só interface)
src/components/    componentes de apresentação
supabase/migrations/ esquema, RLS e dados iniciais
```

- Filtros ficam na URL (`?inicio=AAAA-MM&fim=AAAA-MM&ind=IPCA,USD`) e são validados no servidor; o assistente recebe os mesmos filtros e consulta o banco de novo.
- Refresh token do Google criptografado (AES-256-GCM) na tabela `google_tokens`.
- O app web nunca usa a chave secreta do Supabase.

## PWA

- Manifesto em `src/app/manifest.ts`; ícones provisórios gerados em `/icones/*` (substituir pelo logo oficial).
- Service worker servido por `/sw.js` com a versão do deploy: estáticos em cache; páginas de dados em "rede primeiro" (cache só offline); login, APIs, relatórios, agenda, assistente e admin nunca vão para o cache; o cache de páginas é apagado ao sair.
- Aviso "Sem conexão — dados de …" e "Nova versão disponível — Atualizar".
- Botão "Instalar app" (Android/desktop) e dica para iPhone.

## Comandos

Em `Aplicativo/` ou `Website/`:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Um único teste: `npx vitest run src/lib/dominio/inflacao.test.ts`. Script Python: `python -m unittest` dentro de `Aplicativo/scripts/indicadores/`.

## Limitações conhecidas

- Os limites de perguntas do assistente (10/min por usuário), de login (5 a cada 15 min por IP e por e-mail), de cadastro (5/hora por IP) e de nova senha (3/hora) são em memória: cada instância serverless tem o próprio contador.
- Quem entra com senha não tem token do Google (Relatórios e Agenda pedem login Google). O Google em modo *Testing* só aceita os usuários de teste.
- O rascunho do Gmail recalcula o resumo com os dados atuais; se os dados forem revisados depois da geração, o texto pode diferir da planilha anexa.
- Ícones do PWA são provisórios até o envio do logo oficial.
- Textos institucionais do site são provisórios (`Website/src/conteudo/institucional.ts`).
- O login Google dentro do app instalado no iPhone precisa ser validado no aparelho.
- A carga de dados roda pela Action *Carga de indicadores* (dias úteis, 9h) ou manualmente pelo script.
- Modelo do Gemini fixo em `src/lib/gemini/assistente.ts` (`gemini-2.5-flash`); atualize quando o Google descontinuar a versão.
