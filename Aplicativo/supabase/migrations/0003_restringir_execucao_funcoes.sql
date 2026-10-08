-- =====================================================================
-- Portal Perfin — fecha a execução de funções pela API (alerta do Security Advisor)
-- No Supabase, funções novas do schema public recebem EXECUTE para anon e authenticated por
-- privilégio padrão; o "revoke ... from public" da 0001 não basta.
-- - criar_perfil: só gatilho, ninguém chama pela API
-- - registrar_acesso: só usuário logado
-- - eh_admin, usuario_ativo, pode_ler_dados: só usuário logado (o anônimo lê dados públicos
--   pela política "publico" e pela função metas_inflacao_publicas, que continua aberta)
-- =====================================================================

revoke execute on function public.criar_perfil() from public, anon, authenticated;
revoke execute on function public.registrar_acesso() from anon;
revoke execute on function public.eh_admin(), public.usuario_ativo(), public.pode_ler_dados() from anon;
