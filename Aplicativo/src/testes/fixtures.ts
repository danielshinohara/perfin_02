import type { Ponto, RegraAlerta } from '@/lib/dominio/tipos'

/** IPCA mensal oficial de 2024 (IBGE): acumulado no ano = 4,83%. */
export const IPCA_2024 = ['0.42', '0.83', '0.16', '0.38', '0.46', '0.21', '0.38', '-0.02', '0.44', '0.56', '0.39', '0.52']

export function serieMensal(ano: number, valores: string[], mesInicial = 1): Ponto[] {
  return valores.map((valor, i) => {
    const total = ano * 12 + (mesInicial - 1) + i
    const mes = String((total % 12) + 1).padStart(2, '0')
    return { data: `${Math.floor(total / 12)}-${mes}-01`, valor }
  })
}

/** Série diária (todos os dias corridos) a partir de uma data, para testes simples. */
export function serieDiaria(inicio: string, valores: string[]): Ponto[] {
  const base = new Date(`${inicio}T00:00:00Z`)
  return valores.map((valor, i) => {
    const d = new Date(base)
    d.setUTCDate(d.getUTCDate() + i)
    return { data: d.toISOString().slice(0, 10), valor }
  })
}

export function regra(parcial: Partial<RegraAlerta> & Pick<RegraAlerta, 'codigo'>): RegraAlerta {
  return { descricao: '', limite: null, limiteSecundario: null, severidade: 'atencao', ativa: true, ...parcial }
}
