import { randomBytes } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { cifrar, decifrar, TokenInvalidoError } from './tokens'

const CHAVE = randomBytes(32).toString('base64')

describe('criptografia de tokens', () => {
  it('ida e volta', () => {
    const cifrado = cifrar('refresh-token-de-teste', CHAVE)
    expect(cifrado.startsWith('v1.')).toBe(true)
    expect(cifrado).not.toContain('refresh-token-de-teste')
    expect(decifrar(cifrado, CHAVE)).toBe('refresh-token-de-teste')
  })

  it('cada cifragem usa um IV diferente', () => {
    expect(cifrar('x', CHAVE)).not.toBe(cifrar('x', CHAVE))
  })

  it('rejeita conteúdo adulterado, chave errada e formato inválido', () => {
    const partes = cifrar('segredo', CHAVE).split('.')
    partes[3] = Buffer.from('outro').toString('base64url')
    expect(() => decifrar(partes.join('.'), CHAVE)).toThrow(TokenInvalidoError)
    expect(() => decifrar(cifrar('segredo', CHAVE), randomBytes(32).toString('base64'))).toThrow(TokenInvalidoError)
    expect(() => decifrar('lixo', CHAVE)).toThrow(TokenInvalidoError)
    const truncado = cifrar('segredo', CHAVE).split('.')
    truncado[2] = Buffer.from(truncado[2], 'base64url').subarray(0, 4).toString('base64url')
    expect(() => decifrar(truncado.join('.'), CHAVE)).toThrow(TokenInvalidoError)
  })

  it('exige chave de 32 bytes', () => {
    expect(() => cifrar('x', randomBytes(16).toString('base64'))).toThrow()
  })
})
