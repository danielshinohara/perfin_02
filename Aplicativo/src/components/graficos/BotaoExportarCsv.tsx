'use client'

import type { DadosGrafico } from '@/lib/dominio/paineis/tipos'
import { montarCsv } from '@/lib/dominio/paineis/csv'

export function BotaoExportarCsv({ dados, nomeArquivo }: { dados: DadosGrafico; nomeArquivo: string }) {
  const exportar = () => {
    const blob = new Blob([montarCsv(dados)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${nomeArquivo}.csv`
    link.click()
    // Revogar só depois: alguns navegadores cancelam o download se o link for revogado na hora.
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return (
    <button type="button" className="botao botao-secundario" onClick={exportar}>
      Exportar CSV
    </button>
  )
}
