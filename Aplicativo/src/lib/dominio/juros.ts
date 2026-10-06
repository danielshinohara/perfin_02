import { pontosEntre, somarDias, ultimoPontoAte } from './datas'
import { comporPercentuais, Dec } from './numeros'
import type { DataISO, Ponto } from './tipos'

/** Dias corridos sem CDI aceitos nas pontas do período (fins de semana e feriados prolongados). */
const TOLERANCIA_DIAS = 5

/**
 * CDI acumulado entre duas datas (inclusive), compondo as taxas diárias (% a.d.).
 * Retorna null se a série não cobre o período (dados faltando no início ou no fim),
 * para não exibir um acumulado parcial como se fosse completo.
 */
export function cdiAcumulado(cdiDiario: Ponto[], inicio: DataISO, fim: DataISO): Dec | null {
  const dias = pontosEntre(cdiDiario, inicio, fim)
  if (dias.length === 0) return null
  const cobreInicio = dias[0].data <= somarDias(inicio, TOLERANCIA_DIAS)
  const cobreFim = dias.at(-1)!.data >= somarDias(fim, -TOLERANCIA_DIAS)
  return cobreInicio && cobreFim ? comporPercentuais(dias.map((p) => new Dec(p.valor))) : null
}

/** Valor vigente da série numa data (ex.: meta Selic). */
export function valorVigente(serie: Ponto[], data: DataISO): Dec | null {
  const ponto = ultimoPontoAte(serie, data)
  return ponto ? new Dec(ponto.valor) : null
}

export interface DecisaoCopom {
  data: DataISO
  taxa: Dec
  variacaoPp: Dec
}

/** Reduz a série diária da meta Selic às datas em que a taxa mudou (decisões do Copom). */
export function decisoesCopom(selicMeta: Ponto[]): DecisaoCopom[] {
  const decisoes: DecisaoCopom[] = []
  let anterior: Dec | null = null
  for (const ponto of selicMeta) {
    const taxa = new Dec(ponto.valor)
    if (anterior && !taxa.eq(anterior)) {
      decisoes.push({ data: ponto.data, taxa, variacaoPp: taxa.minus(anterior) })
    }
    anterior = taxa
  }
  return decisoes
}
