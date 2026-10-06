import 'server-only'
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

const VERSAO = 'v1'
const ALGORITMO = 'aes-256-gcm'
const TAMANHO_IV = 12
const TAMANHO_TAG = 16

export class TokenInvalidoError extends Error {}

function chave(chaveBase64: string): Buffer {
  const bytes = Buffer.from(chaveBase64, 'base64')
  if (bytes.length !== 32) throw new Error('A chave de criptografia deve ter 32 bytes')
  return bytes
}

/** Criptografa com AES-256-GCM. Formato: `v1.<iv>.<tag>.<cifra>` em base64url. */
export function cifrar(texto: string, chaveBase64: string): string {
  const iv = randomBytes(TAMANHO_IV)
  const cifra = createCipheriv(ALGORITMO, chave(chaveBase64), iv, { authTagLength: TAMANHO_TAG })
  const conteudo = Buffer.concat([cifra.update(texto, 'utf8'), cifra.final()])
  return [VERSAO, iv, cifra.getAuthTag(), conteudo].map((p) => (typeof p === 'string' ? p : p.toString('base64url'))).join('.')
}

export function decifrar(valor: string, chaveBase64: string): string {
  const [versao, iv, tag, conteudo] = valor.split('.')
  const bytesTag = Buffer.from(tag ?? '', 'base64url')
  if (versao !== VERSAO || !iv || bytesTag.length !== TAMANHO_TAG || !conteudo) throw new TokenInvalidoError('Formato de token inválido')
  try {
    const decifra = createDecipheriv(ALGORITMO, chave(chaveBase64), Buffer.from(iv, 'base64url'), { authTagLength: TAMANHO_TAG })
    decifra.setAuthTag(bytesTag)
    return Buffer.concat([decifra.update(Buffer.from(conteudo, 'base64url')), decifra.final()]).toString('utf8')
  } catch {
    // Não repassa detalhes: falha de autenticação do GCM significa token adulterado ou chave errada.
    throw new TokenInvalidoError('Não foi possível decifrar o token')
  }
}
