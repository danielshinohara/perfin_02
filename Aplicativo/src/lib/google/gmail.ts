import 'server-only'
import { chamarGoogleJson } from './http'
import { montarMensagemMime, paraBase64Url, type MensagemRascunho } from './mime'

/** Único endpoint do Gmail usado pelo portal: criação de RASCUNHO. O portal nunca envia e-mails. */
const ENDPOINT_RASCUNHOS = 'https://gmail.googleapis.com/gmail/v1/users/me/drafts'
export const LINK_RASCUNHOS = 'https://mail.google.com/mail/#drafts'

export async function criarRascunho(accessToken: string, mensagem: MensagemRascunho): Promise<string> {
  const resposta = await chamarGoogleJson<{ id: string }>(ENDPOINT_RASCUNHOS, accessToken, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: { raw: paraBase64Url(montarMensagemMime(mensagem)) } }),
  })
  return resposta.id
}
