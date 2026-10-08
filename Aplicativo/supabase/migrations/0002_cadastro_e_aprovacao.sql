-- =====================================================================
-- Portal Perfin — cadastro aberto (e-mail/senha ou Google) com aprovação do admin
-- Roda depois de 0001_inicial.sql.
-- - perfis.bloqueado vira perfis.situacao ('pendente' | 'ativo' | 'bloqueado')
-- - contas novas nascem 'pendente'; só o e-mail de administrador, já confirmado, nasce 'ativo'
-- - o admin aprova só contas com e-mail confirmado, pela função definir_situacao_usuario (auditada)
-- - sai o hook que recusava cadastro por e-mail e senha
-- ANTES DE APLICAR: em Authentication → Hooks, o "Before User Created" deve estar desligado
-- (se apontar para a função removida aqui, todo cadastro novo falha).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Perfis: situação, provedor, confirmação de e-mail e auditoria
-- ---------------------------------------------------------------------

alter table public.perfis
  add column situacao text not null default 'pendente'
    check (situacao in ('pendente', 'ativo', 'bloqueado')),
  add column provedor text check (provedor in ('google', 'email')),
  add column email_confirmado_em timestamptz,
  add column situacao_alterada_em timestamptz,
  add column situacao_alterada_por uuid references auth.users (id) on delete set null;

-- Perfis que já existiam continuam com o acesso que tinham.
update public.perfis p
   set situacao = case when p.bloqueado then 'bloqueado' else 'ativo' end,
       email_confirmado_em = u.email_confirmed_at
  from auth.users u
 where u.id = p.user_id;

-- Troca a checagem de acesso antes de remover a coluna antiga.
create or replace function public.usuario_ativo()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfis
    where user_id = (select auth.uid()) and situacao = 'ativo'
  );
$$;

-- A política e o grant antigos dependem da coluna bloqueado.
drop policy "perfis: admin bloqueia/desbloqueia" on public.perfis;
revoke update (bloqueado) on public.perfis from authenticated;
alter table public.perfis drop column bloqueado;

create index perfis_situacao_idx on public.perfis (situacao);

-- ---------------------------------------------------------------------
-- 2. Gatilhos
-- ---------------------------------------------------------------------

-- Novo usuário: 'pendente'; 'ativo' só se o e-mail for de administrador E já estiver confirmado
-- (o admin é criado no painel com "Auto Confirm User"; um cadastro feito por terceiros com o
-- e-mail do admin nasce sem confirmação e fica pendente).
create or replace function public.criar_perfil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(new.email);
  v_provedor text := new.raw_app_meta_data ->> 'provider';
begin
  insert into public.perfis (user_id, email, nome, provedor, email_confirmado_em, situacao)
  values (
    new.id,
    v_email,
    nullif(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'nome')), ''),
    case when v_provedor in ('google', 'email') then v_provedor end,
    new.email_confirmed_at,
    case
      when new.email_confirmed_at is not null
       and exists (select 1 from public.administradores a where a.email = v_email) then 'ativo'
      else 'pendente'
    end
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

-- Mantém perfis.email_confirmado_em em dia quando o usuário confirma o e-mail.
create or replace function public.sincronizar_confirmacao_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.perfis
     set email_confirmado_em = new.email_confirmed_at
   where user_id = new.id;
  return new;
end;
$$;

create trigger ao_confirmar_email
  after update of email_confirmed_at on auth.users
  for each row
  when (old.email_confirmed_at is distinct from new.email_confirmed_at)
  execute function public.sincronizar_confirmacao_email();

-- E-mail de administrador cadastrado depois do usuário: ativa o perfil (se o e-mail estiver confirmado).
create or replace function public.ativar_perfil_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.perfis
     set situacao = 'ativo',
         situacao_alterada_em = now()
   where email = new.email
     and email_confirmado_em is not null
     and situacao = 'pendente';
  return new;
end;
$$;

create trigger ao_cadastrar_administrador
  after insert on public.administradores
  for each row execute function public.ativar_perfil_admin();

revoke execute on function public.sincronizar_confirmacao_email(), public.ativar_perfil_admin() from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 3. Aprovação pelo admin
-- ---------------------------------------------------------------------

-- Aprovar, bloquear ou desbloquear um usuário. Só o admin (sessão com senha), nunca a si mesmo,
-- e só aprova quem já confirmou o e-mail.
create or replace function public.definir_situacao_usuario(p_user_id uuid, p_situacao text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_confirmado timestamptz;
begin
  if not public.eh_admin() then
    raise exception 'Acesso negado' using errcode = '42501';
  end if;
  if p_situacao is null or p_situacao not in ('ativo', 'bloqueado') then
    raise exception 'Situação inválida' using errcode = '22023';
  end if;
  if p_user_id = (select auth.uid()) then
    raise exception 'O administrador não pode alterar a própria situação' using errcode = '42501';
  end if;

  select email_confirmado_em into v_confirmado from public.perfis where user_id = p_user_id for update;
  if not found then
    raise exception 'Usuário não encontrado' using errcode = 'P0002';
  end if;
  if p_situacao = 'ativo' and v_confirmado is null then
    raise exception 'O usuário ainda não confirmou o e-mail' using errcode = '22023';
  end if;

  update public.perfis
     set situacao = p_situacao,
         situacao_alterada_em = now(),
         situacao_alterada_por = (select auth.uid())
   where user_id = p_user_id;
end;
$$;

revoke execute on function public.definir_situacao_usuario(uuid, text) from public, anon;
grant execute on function public.definir_situacao_usuario(uuid, text) to authenticated;

-- ---------------------------------------------------------------------
-- 4. Cadastro por e-mail liberado: o controle passa a ser a aprovação do admin
-- ---------------------------------------------------------------------

drop function if exists public.hook_restringir_cadastro(jsonb);
