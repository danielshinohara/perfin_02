import 'server-only'

/** O Google recusou o token (revogado/expirado): o usuário precisa entrar com Google de novo. */
export class GoogleReconectarError extends Error {
  constructor() {
    super('A conexão com o Google expirou. Entre novamente com Google.')
  }
}

export class GoogleApiError extends Error {
  constructor(
    readonly status: number,
    mensagem: string,
  ) {
    super(mensagem)
  }
}

/** Chamada autenticada às APIs do Google. Nunca registra o token nem o cabeçalho Authorization. */
export async function chamarGoogle(url: string, accessToken: string, init: RequestInit = {}): Promise<Response> {
  const resposta = await fetch(url, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  })
  if (resposta.status === 401) throw new GoogleReconectarError()
  if (!resposta.ok) {
    const corpo = (await resposta.json().catch(() => null)) as { error?: { message?: string } } | null
    throw new GoogleApiError(resposta.status, corpo?.error?.message ?? `Erro ${resposta.status} na API do Google`)
  }
  return resposta
}

export async function chamarGoogleJson<T>(url: string, accessToken: string, init: RequestInit = {}): Promise<T> {
  const resposta = await chamarGoogle(url, accessToken, init)
  return (await resposta.json()) as T
}
