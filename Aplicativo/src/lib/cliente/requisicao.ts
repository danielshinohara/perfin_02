export interface RespostaApi<T> {
  dados: T | null
  erro: string | null
  reconectar: boolean
}

/** POST para as rotas do portal com tratamento de erro e de falta de conexão. */
export async function enviarPost<T>(url: string, corpo?: unknown): Promise<RespostaApi<T>> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { dados: null, erro: 'Sem conexão. Tente novamente quando a internet voltar.', reconectar: false }
  }
  try {
    const resposta = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    })
    const json = (await resposta.json().catch(() => ({}))) as { erro?: string; reconectar?: boolean } & T
    if (!resposta.ok) return { dados: null, erro: json.erro ?? 'Algo deu errado.', reconectar: Boolean(json.reconectar) }
    return { dados: json, erro: null, reconectar: false }
  } catch {
    return { dados: null, erro: 'Não foi possível falar com o servidor. Verifique a conexão.', reconectar: false }
  }
}
