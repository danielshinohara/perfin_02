-- =====================================================================
-- Portal Perfin — esquema inicial
-- Rodar uma única vez no SQL Editor do Supabase (ou via `supabase db push`).
-- Todas as tabelas têm RLS ligado; nenhuma política usa `using (true)`.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Tabelas
-- ---------------------------------------------------------------------

create table public.administradores (
  email text primary key check (email = lower(btrim(email)))
);

create table public.perfis (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  nome text,
  bloqueado boolean not null default false,
  criado_em timestamptz not null default now(),
  ultimo_acesso_em timestamptz
);

create table public.indicadores (
  codigo text primary key,
  nome text not null,
  grupo text not null check (grupo in ('inflacao', 'juros', 'cambio', 'atividade')),
  unidade text not null,
  periodicidade text not null check (periodicidade in ('diaria', 'mensal', 'trimestral')),
  fonte text not null,
  serie_codigo text not null,
  publico boolean not null default false,
  ordem int not null
);

create table public.indicador_valores (
  indicador_codigo text not null references public.indicadores (codigo),
  data_referencia date not null,
  valor numeric(20, 8) not null,
  atualizado_em timestamptz not null default now(),
  primary key (indicador_codigo, data_referencia)
);

-- Boletim Focus. `referencia` = ano ('2026') ou '12M' (inflação esperada nos próximos 12 meses).
create table public.expectativas_focus (
  indicador text not null check (indicador in ('IPCA', 'SELIC', 'CAMBIO', 'PIB')),
  referencia text not null check (referencia ~ '^([0-9]{4}|12M)$'),
  data_coleta date not null,
  mediana numeric(20, 8) not null,
  atualizado_em timestamptz not null default now(),
  primary key (indicador, referencia, data_coleta)
);

create table public.metas_inflacao (
  ano int primary key,
  centro numeric(5, 2) not null,
  tolerancia numeric(5, 2) not null
);

create table public.regras_alerta (
  codigo text primary key,
  descricao text not null,
  limite numeric(12, 4),
  limite_secundario numeric(12, 4),
  severidade text not null check (severidade in ('informativo', 'atencao', 'alerta')),
  ativa boolean not null default true,
  atualizado_por uuid references auth.users (id) on delete set null,
  atualizado_em timestamptz not null default now()
);

create table public.google_tokens (
  user_id uuid primary key references auth.users (id) on delete cascade,
  refresh_token_cifrado text not null,
  escopos text not null,
  atualizado_em timestamptz not null default now()
);

create table public.relatorios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  mes_referencia date not null check (extract(day from mes_referencia) = 1),
  planilha_id text not null,
  planilha_url text not null,
  rascunho_gmail_id text,
  criado_em timestamptz not null default now()
);

create index relatorios_user_id_idx on public.relatorios (user_id, criado_em desc);
create index indicador_valores_data_idx on public.indicador_valores (data_referencia);
create index indicador_valores_atualizado_idx on public.indicador_valores (atualizado_em desc);

-- ---------------------------------------------------------------------
-- 2. Funções de autorização
-- ---------------------------------------------------------------------

-- Admin = e-mail cadastrado em `administradores` E sessão aberta com senha.
-- Se o mesmo e-mail entrar pelo Google, ele é tratado como usuário comum.
create or replace function public.eh_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
           select 1
           from public.administradores a
           where a.email = lower(coalesce(auth.jwt() ->> 'email', ''))
         )
     -- O `amr` pode vir como objetos ([{"method": "password"}]) ou texto (["password"]).
     and (coalesce(auth.jwt() -> 'amr', '[]'::jsonb) @> '[{"method": "password"}]'::jsonb
          or coalesce(auth.jwt() -> 'amr', '[]'::jsonb) @> '["password"]'::jsonb);
$$;

create or replace function public.usuario_ativo()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfis p
    where p.user_id = auth.uid() and not p.bloqueado
  );
$$;

create or replace function public.pode_ler_dados()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.eh_admin() or public.usuario_ativo();
$$;

-- Registra o último acesso do próprio usuário (o usuário não tem update na tabela).
create or replace function public.registrar_acesso()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.perfis set ultimo_acesso_em = now() where user_id = auth.uid();
$$;

-- Metas de inflação são públicas (CMN); o site lê por esta função, sem política anônima na tabela.
create or replace function public.metas_inflacao_publicas()
returns setof public.metas_inflacao
language sql
stable
security definer
set search_path = ''
as $$
  select * from public.metas_inflacao order by ano;
$$;

revoke execute on function public.eh_admin(), public.usuario_ativo(), public.pode_ler_dados(),
  public.registrar_acesso(), public.metas_inflacao_publicas() from public;
grant execute on function public.eh_admin(), public.usuario_ativo(), public.pode_ler_dados()
  to anon, authenticated;
grant execute on function public.registrar_acesso() to authenticated;
grant execute on function public.metas_inflacao_publicas() to anon, authenticated;

-- ---------------------------------------------------------------------
-- 3. Gatilhos
-- ---------------------------------------------------------------------

create or replace function public.criar_perfil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfis (user_id, email, nome)
  values (new.id, lower(new.email), new.raw_user_meta_data ->> 'full_name')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function public.criar_perfil();

create or replace function public.carimbar_regra_alerta()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.atualizado_por := auth.uid();
  new.atualizado_em := now();
  return new;
end;
$$;

create trigger ao_atualizar_regra
  before update on public.regras_alerta
  for each row execute function public.carimbar_regra_alerta();

-- Hook "Before User Created": só o admin (criado manualmente no painel ANTES de ligar o hook)
-- usa e-mail e senha; qualquer novo cadastro por e-mail é recusado.
create or replace function public.hook_restringir_cadastro(event jsonb)
returns jsonb
language plpgsql
set search_path = ''
as $$
begin
  if coalesce(event -> 'user' -> 'app_metadata' ->> 'provider', '') = 'email' then
    return jsonb_build_object(
      'error', jsonb_build_object(
        'http_code', 403,
        'message', 'Cadastro por e-mail e senha não é permitido.'
      )
    );
  end if;
  return '{}'::jsonb;
end;
$$;

revoke execute on function public.hook_restringir_cadastro(jsonb) from public, anon, authenticated;
grant execute on function public.hook_restringir_cadastro(jsonb) to supabase_auth_admin;

-- ---------------------------------------------------------------------
-- 4. RLS e permissões
-- ---------------------------------------------------------------------

alter table public.administradores enable row level security;
alter table public.perfis enable row level security;
alter table public.indicadores enable row level security;
alter table public.indicador_valores enable row level security;
alter table public.expectativas_focus enable row level security;
alter table public.metas_inflacao enable row level security;
alter table public.regras_alerta enable row level security;
alter table public.google_tokens enable row level security;
alter table public.relatorios enable row level security;

-- Começa sem nenhum privilégio para os papéis da API e concede só o necessário.
revoke all on public.administradores, public.perfis, public.indicadores, public.indicador_valores,
  public.expectativas_focus, public.metas_inflacao, public.regras_alerta, public.google_tokens,
  public.relatorios from anon, authenticated;

grant select on public.indicadores, public.indicador_valores to anon, authenticated;
grant select on public.expectativas_focus, public.metas_inflacao, public.regras_alerta to authenticated;
grant select on public.perfis to authenticated;
grant update (bloqueado) on public.perfis to authenticated;
grant update (limite, limite_secundario, severidade, ativa) on public.regras_alerta to authenticated;
grant select, insert, update, delete on public.google_tokens to authenticated;
grant select, insert on public.relatorios to authenticated;
grant update (rascunho_gmail_id) on public.relatorios to authenticated;

-- administradores: sem políticas (só o SQL Editor / service role).

-- perfis
create policy "perfis: leitura do próprio ou admin" on public.perfis
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.eh_admin()));

create policy "perfis: admin bloqueia/desbloqueia" on public.perfis
  for update to authenticated
  using ((select public.eh_admin()))
  with check ((select public.eh_admin()));

-- indicadores e valores
create policy "indicadores: leitura de usuários ativos" on public.indicadores
  for select to authenticated
  using ((select public.pode_ler_dados()));

create policy "indicadores: anônimo só públicos" on public.indicadores
  for select to anon
  using (publico);

create policy "valores: leitura de usuários ativos" on public.indicador_valores
  for select to authenticated
  using ((select public.pode_ler_dados()));

create policy "valores: anônimo só de indicadores públicos" on public.indicador_valores
  for select to anon
  using (exists (
    select 1 from public.indicadores i
    where i.codigo = indicador_valores.indicador_codigo and i.publico
  ));

create policy "focus: leitura de usuários ativos" on public.expectativas_focus
  for select to authenticated
  using ((select public.pode_ler_dados()));

create policy "metas: leitura de usuários ativos" on public.metas_inflacao
  for select to authenticated
  using ((select public.pode_ler_dados()));

-- regras de alerta
create policy "regras: leitura de usuários ativos" on public.regras_alerta
  for select to authenticated
  using ((select public.pode_ler_dados()));

create policy "regras: admin altera" on public.regras_alerta
  for update to authenticated
  using ((select public.eh_admin()))
  with check ((select public.eh_admin()));

-- tokens do Google (somente o dono)
create policy "tokens: dono" on public.google_tokens
  for all to authenticated
  using (user_id = (select auth.uid()) and (select public.usuario_ativo()))
  with check (user_id = (select auth.uid()) and (select public.usuario_ativo()));

-- relatórios (somente o dono)
create policy "relatorios: dono lê" on public.relatorios
  for select to authenticated
  using (user_id = (select auth.uid()) and (select public.usuario_ativo()));

create policy "relatorios: dono cria" on public.relatorios
  for insert to authenticated
  with check (user_id = (select auth.uid()) and (select public.usuario_ativo()));

create policy "relatorios: dono atualiza" on public.relatorios
  for update to authenticated
  using (user_id = (select auth.uid()) and (select public.usuario_ativo()))
  with check (user_id = (select auth.uid()) and (select public.usuario_ativo()));

-- ---------------------------------------------------------------------
-- 5. Dados iniciais
-- ---------------------------------------------------------------------

insert into public.indicadores (codigo, nome, grupo, unidade, periodicidade, fonte, serie_codigo, publico, ordem) values
  ('IPCA',       'IPCA',                          'inflacao',  '% a.m.',     'mensal',     'BCB/SGS',    '433',   true,  1),
  ('IGPM',       'IGP-M',                         'inflacao',  '% a.m.',     'mensal',     'BCB/SGS',    '189',   true,  2),
  ('INPC',       'INPC',                          'inflacao',  '% a.m.',     'mensal',     'BCB/SGS',    '188',   false, 3),
  ('SELIC_META', 'Meta Selic',                    'juros',     '% a.a.',     'diaria',     'BCB/SGS',    '432',   true,  4),
  ('CDI',        'CDI',                           'juros',     '% a.d.',     'diaria',     'BCB/SGS',    '12',    true,  5),
  ('USD',        'Dólar PTAX venda',              'cambio',    'R$',         'diaria',     'BCB/SGS',    '1',     true,  6),
  ('EUR',        'Euro PTAX venda',               'cambio',    'R$',         'diaria',     'BCB/SGS',    '21619', false, 7),
  ('IBCBR',      'IBC-Br (dessazonalizado)',      'atividade', 'índice',     'mensal',     'BCB/SGS',    '24364', false, 8),
  ('FBCF',       'FBCF (valores correntes)',      'atividade', 'R$ milhões', 'trimestral', 'IBGE/SIDRA', '1846',  false, 9),
  ('FBCF_REAL',  'FBCF real (var. interanual)',   'atividade', '%',          'trimestral', 'IBGE/SIDRA', '5932',  false, 10);

-- Metas definidas pelo CMN (a partir de 2025, meta contínua). Conferir no site do BCB ao atualizar.
insert into public.metas_inflacao (ano, centro, tolerancia) values
  (2015, 4.50, 2.00), (2016, 4.50, 2.00), (2017, 4.50, 1.50), (2018, 4.50, 1.50),
  (2019, 4.25, 1.50), (2020, 4.00, 1.50), (2021, 3.75, 1.50), (2022, 3.50, 1.50),
  (2023, 3.25, 1.50), (2024, 3.00, 1.50), (2025, 3.00, 1.50), (2026, 3.00, 1.50),
  (2027, 3.00, 1.50);

insert into public.regras_alerta (codigo, descricao, limite, limite_secundario, severidade) values
  ('IPCA_FORA_META',        'IPCA em 12 meses fora da banda da meta',                       null, null, 'alerta'),
  ('INFLACAO_ACELERANDO',   'Média de 3 meses anualizada acima do IPCA 12m (p.p.)',         1.0,  null, 'atencao'),
  ('JURO_REAL',             'Juro real ex-ante alto (limite) ou baixo (limite secundário)', 6.0,  2.0,  'atencao'),
  ('SPREAD_IGPM_IPCA',      'Diferença IGP-M − IPCA em 12 meses (p.p.)',                    3.0,  null, 'atencao'),
  ('DOLAR_MOVIMENTO',       'Variação do dólar no mês (%)',                                  5.0,  null, 'alerta'),
  ('DOLAR_VOLATILIDADE',    'Volatilidade do dólar acima da média de 12 meses (vezes)',     1.5,  null, 'atencao'),
  ('FOCUS_REVISOES',        'Semanas seguidas de revisão da expectativa de IPCA',           4,    null, 'atencao'),
  ('CDI_REAL',              'Rendimento real do CDI no ano',                                 null, null, 'informativo'),
  ('ATIVIDADE_DESACELERA',  'Queda do crescimento em 12 meses do IBC-Br (p.p.)',            0.5,  null, 'atencao'),
  ('MAIORES_VARIACOES',     'Indicadores que mais variaram no período',                      null, null, 'informativo');

-- Depois de rodar este arquivo, cadastre o e-mail do administrador (o mesmo de ADMIN_USUARIO):
-- insert into public.administradores (email) values ('<email-do-admin>');
