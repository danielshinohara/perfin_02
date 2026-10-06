import 'server-only'
import type { Aba, Celula, ConteudoRelatorio } from '@/lib/dominio/relatorio'
import { chamarGoogleJson } from './http'

const API = 'https://sheets.googleapis.com/v4/spreadsheets'
// Cores da identidade Perfin (fundo #221F20, texto #F9F4F4, verde #4CAC87).
const COR_ESCURA = { red: 0x22 / 255, green: 0x1f / 255, blue: 0x20 / 255 }
const COR_CREME = { red: 0xf9 / 255, green: 0xf4 / 255, blue: 0xf4 / 255 }
const COR_VERDE = { red: 0x4c / 255, green: 0xac / 255, blue: 0x87 / 255 }

function celula(valor: Celula, cabecalho: boolean) {
  const formato = cabecalho
    ? { userEnteredFormat: { backgroundColor: COR_ESCURA, textFormat: { bold: true, foregroundColor: COR_CREME } } }
    : {}
  if (valor === null) return formato
  if (typeof valor === 'number') {
    return { userEnteredValue: { numberValue: valor }, userEnteredFormat: { numberFormat: { type: 'NUMBER', pattern: '#,##0.00##' } } }
  }
  return { userEnteredValue: { stringValue: valor }, ...formato }
}

function folha(aba: Aba, indice: number) {
  return {
    properties: { sheetId: indice, title: aba.titulo, gridProperties: { frozenRowCount: 1 } },
    data: [{ startRow: 0, startColumn: 0, rowData: aba.linhas.map((linha, i) => ({ values: linha.map((v) => celula(v, i === 0)) })) }],
  }
}

function faixa(sheetId: number, linhas: number, coluna: number) {
  return { sources: [{ sheetId, startRowIndex: 0, endRowIndex: linhas, startColumnIndex: coluna, endColumnIndex: coluna + 1 }] }
}

function grafico(sheetId: number, linhas: number) {
  return {
    addChart: {
      chart: {
        spec: {
          title: 'IPCA em 12 meses × meta de inflação',
          basicChart: {
            chartType: 'LINE',
            legendPosition: 'BOTTOM_LEGEND',
            headerCount: 1,
            axis: [{ position: 'BOTTOM_AXIS', title: 'Mês' }, { position: 'LEFT_AXIS', title: '%' }],
            domains: [{ domain: { sourceRange: faixa(sheetId, linhas, 0) } }],
            series: [1, 2, 3, 4].map((coluna) => ({
              series: { sourceRange: faixa(sheetId, linhas, coluna) },
              targetAxis: 'LEFT_AXIS',
              ...(coluna === 1 ? { color: COR_VERDE } : {}),
            })),
          },
        },
        position: { overlayPosition: { anchorCell: { sheetId, rowIndex: 1, columnIndex: 6 } } },
      },
    },
  }
}

/** Cria a Planilha no Drive do usuário (escopo drive.file) e devolve id e link. */
export async function criarPlanilha(accessToken: string, conteudo: ConteudoRelatorio): Promise<{ id: string; url: string }> {
  const planilha = await chamarGoogleJson<{ spreadsheetId: string; spreadsheetUrl: string }>(API, accessToken, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      properties: { title: conteudo.titulo, locale: 'pt_BR', timeZone: 'America/Sao_Paulo' },
      sheets: conteudo.abas.map(folha),
    }),
  })

  const ajustes = [
    ...conteudo.abas.map((_, i) => ({ autoResizeDimensions: { dimensions: { sheetId: i, dimension: 'COLUMNS', startIndex: 0, endIndex: 10 } } })),
    grafico(conteudo.abaGrafico, conteudo.abas[conteudo.abaGrafico].linhas.length),
  ]
  await chamarGoogleJson(`${API}/${planilha.spreadsheetId}:batchUpdate`, accessToken, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requests: ajustes }),
  })
  return { id: planilha.spreadsheetId, url: planilha.spreadsheetUrl }
}
