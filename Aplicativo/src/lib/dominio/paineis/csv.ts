import { formatarNumero } from '../formatos'
import type { DadosGrafico } from './tipos'

function escapar(texto: string): string {
  // Evita injeção de fórmulas ao abrir no Excel e trata separadores.
  const seguro = /^[=+\-@]/.test(texto) ? `'${texto}` : texto
  return /[;"\n]/.test(seguro) ? `"${seguro.replace(/"/g, '""')}"` : seguro
}

/** CSV no padrão brasileiro (`;` como separador, vírgula decimal, BOM para o Excel). */
export function montarCsv(dados: DadosGrafico): string {
  const colunas = [
    ...(dados.faixa ? [dados.faixa.inferior, dados.faixa.superior] : []),
    ...dados.series.map((s) => s.chave),
  ]
  const nomes = [
    ...(dados.faixa ? [`${dados.faixa.nome} (mín.)`, `${dados.faixa.nome} (máx.)`] : []),
    ...dados.series.map((s) => s.nome),
  ]
  const linhas = dados.linhas.map((l) =>
    [escapar(l.rotulo), ...colunas.map((c) => (typeof l[c] === 'number' ? formatarNumero(l[c] as number, 4) : ''))].join(';'),
  )
  return `﻿${['Período', ...nomes].map(escapar).join(';')}\n${linhas.join('\n')}\n`
}
