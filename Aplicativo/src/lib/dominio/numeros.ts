import DecimalBase from 'decimal.js'

/** Decimal com precisão alta e arredondamento "meio para cima" definido explicitamente. */
export const Dec = DecimalBase.clone({ precision: 34, rounding: DecimalBase.ROUND_HALF_UP })
export type Dec = InstanceType<typeof Dec>

export const UM = new Dec(1)
export const CEM = new Dec(100)

/** Compõe variações percentuais: Π(1 + vᵢ/100) − 1, em %. */
export function comporPercentuais(percentuais: Dec[]): Dec {
  const fator = percentuais.reduce((acc, v) => acc.times(UM.plus(v.div(CEM))), UM)
  return fator.minus(UM).times(CEM)
}

/** Fator acumulado Π(1 + vᵢ/100). */
export function fatorAcumulado(percentuais: Dec[]): Dec {
  return percentuais.reduce((acc, v) => acc.times(UM.plus(v.div(CEM))), UM)
}

/** Taxa real: (1 + nominal)/(1 + inflação) − 1, tudo em %. */
export function taxaReal(nominalPct: Dec, inflacaoPct: Dec): Dec {
  return UM.plus(nominalPct.div(CEM)).div(UM.plus(inflacaoPct.div(CEM))).minus(UM).times(CEM)
}

/** Variação percentual entre dois valores. */
export function variacaoPercentual(inicial: Dec, final: Dec): Dec {
  return final.div(inicial).minus(UM).times(CEM)
}

export function media(valores: Dec[]): Dec {
  return valores.reduce((acc, v) => acc.plus(v), new Dec(0)).div(valores.length)
}

/** Desvio-padrão amostral (n − 1). */
export function desvioPadrao(valores: Dec[]): Dec {
  const m = media(valores)
  const somaQuadrados = valores.reduce((acc, v) => acc.plus(v.minus(m).pow(2)), new Dec(0))
  return somaQuadrados.div(valores.length - 1).sqrt()
}

/** Para gráficos: número ou null quando não há dado. */
export function numeroOuNulo(valor: Dec | null): number | null {
  return valor ? paraGrafico(valor) : null
}

/** Converte para número só para exibição em gráficos (nunca para cálculos). */
export function paraGrafico(valor: Dec): number {
  return valor.toDecimalPlaces(6).toNumber()
}
