export interface Anexo {
  nome: string
  tipo: string
  conteudo: Uint8Array
}

export interface MensagemRascunho {
  assunto: string
  corpo: string
  anexo: Anexo
}

/** Cabeçalho com acentos codificado (RFC 2047). */
function codificarCabecalho(texto: string): string {
  return `=?UTF-8?B?${Buffer.from(texto, 'utf8').toString('base64')}?=`
}

function base64EmLinhas(conteudo: Uint8Array | string): string {
  const base64 = Buffer.from(conteudo).toString('base64')
  return base64.match(/.{1,76}/g)?.join('\r\n') ?? ''
}

/** Remove quebras de linha para impedir injeção de cabeçalhos. */
function semQuebras(texto: string): string {
  return texto.replace(/[\r\n]+/g, ' ')
}

/** Monta a mensagem MIME multipart (texto + anexo) usada no rascunho do Gmail. */
export function montarMensagemMime(mensagem: MensagemRascunho, fronteira = `perfin-${Date.now().toString(36)}`): string {
  const nomeAnexo = semQuebras(mensagem.anexo.nome).replace(/"/g, '')
  return [
    'MIME-Version: 1.0',
    `Subject: ${codificarCabecalho(semQuebras(mensagem.assunto))}`,
    `Content-Type: multipart/mixed; boundary="${fronteira}"`,
    '',
    `--${fronteira}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    base64EmLinhas(mensagem.corpo),
    `--${fronteira}`,
    `Content-Type: ${semQuebras(mensagem.anexo.tipo)}; name="${nomeAnexo}"`,
    `Content-Disposition: attachment; filename="${nomeAnexo}"`,
    'Content-Transfer-Encoding: base64',
    '',
    base64EmLinhas(mensagem.anexo.conteudo),
    `--${fronteira}--`,
    '',
  ].join('\r\n')
}

export function paraBase64Url(texto: string): string {
  return Buffer.from(texto, 'utf8').toString('base64url')
}
