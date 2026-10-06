export type Papel = 'admin' | 'usuario'
export type MetodoLogin = 'senha' | 'google' | 'outro'

type EntradaAmr = string | { method?: string }

/** Lê o método de login a partir do claim `amr` do JWT (objetos ou textos). */
export function metodoDeLogin(amr: unknown): MetodoLogin {
  if (!Array.isArray(amr)) return 'outro'
  const metodos = (amr as EntradaAmr[]).map((e) => (typeof e === 'string' ? e : e?.method))
  if (metodos.includes('password')) return 'senha'
  if (metodos.includes('oauth')) return 'google'
  return 'outro'
}

export function normalizarEmail(email: string | null | undefined): string {
  return (email ?? '').trim().toLowerCase()
}

/**
 * Admin = e-mail igual a ADMIN_USUARIO **e** sessão aberta com senha.
 * O mesmo e-mail entrando pelo Google é tratado como usuário.
 */
export function papelDaSessao(email: string | null | undefined, amr: unknown, emailAdmin: string): Papel {
  const ehEmailAdmin = normalizarEmail(email) !== '' && normalizarEmail(email) === normalizarEmail(emailAdmin)
  return ehEmailAdmin && metodoDeLogin(amr) === 'senha' ? 'admin' : 'usuario'
}
