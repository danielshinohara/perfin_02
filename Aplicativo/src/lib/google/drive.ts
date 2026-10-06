import 'server-only'
import { chamarGoogle } from './http'

export const MIME_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
const PADRAO_ID_ARQUIVO = /^[A-Za-z0-9_-]{10,200}$/

/** Exporta uma Planilha Google como .xlsx (escopo drive.file: só arquivos criados pelo app). */
export async function exportarXlsx(accessToken: string, arquivoId: string): Promise<ArrayBuffer> {
  if (!PADRAO_ID_ARQUIVO.test(arquivoId)) throw new Error('Identificador de arquivo inválido')
  const url = `https://www.googleapis.com/drive/v3/files/${arquivoId}/export?mimeType=${encodeURIComponent(MIME_XLSX)}`
  const resposta = await chamarGoogle(url, accessToken)
  return resposta.arrayBuffer()
}
