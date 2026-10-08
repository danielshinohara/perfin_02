import 'server-only'

/** URL do Portal (Aplicativo), vinda de PORTAL_URL. */
export function urlDoPortal(caminho = ''): string {
  const base = process.env.PORTAL_URL
  if (!base) throw new Error('Variável PORTAL_URL não configurada')
  return `${base.replace(/\/$/, '')}${caminho}`
}

/** Links do cabeçalho: o login e o cadastro acontecem no Portal (uma única sessão). */
export function linksDeAcesso(): { entrar: string; criarConta: string } {
  return { entrar: urlDoPortal('/login'), criarConta: urlDoPortal('/login?modo=cadastro') }
}
