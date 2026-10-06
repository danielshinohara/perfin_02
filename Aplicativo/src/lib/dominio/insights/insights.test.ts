import { describe, expect, it } from 'vitest'
import { gerarInsights, gerarInsightsPublicos } from './gerar'
import type { ContextoInsights } from './contexto'
import type { DadosAnalise, Ponto } from '../tipos'
import { IPCA_2024, regra, serieDiaria, serieMensal } from '@/testes/fixtures'

const metas = [
  { ano: 2024, centro: '3.00', tolerancia: '1.50' },
  { ano: 2025, centro: '3.00', tolerancia: '1.50' },
]

function contexto(dados: Partial<DadosAnalise>, referencia = '2025-03-31'): ContextoInsights {
  return {
    dados: { series: {}, metas, expectativas: [], ...dados },
    referencia,
    filtros: { inicio: '2025-01', fim: '2025-03', indicadores: ['IPCA', 'USD', 'CDI'] },
  }
}

function dolarComVariacaoNoMes(percentual: string): Ponto[] {
  const final = (5 * (1 + Number(percentual) / 100)).toFixed(6)
  return [
    { data: '2025-02-28', valor: '5' },
    { data: '2025-03-31', valor: final },
  ]
}

describe('insights', () => {
  it('IPCA acima do teto vira alerta com meses seguidos', () => {
    const ipca = serieMensal(2024, [...IPCA_2024, '0.16', '1.31', '0.56'])
    const [insight] = gerarInsights(contexto({ series: { IPCA: ipca } }), [
      regra({ codigo: 'IPCA_FORA_META', severidade: 'alerta' }),
    ])
    expect(insight).toMatchObject({ regra: 'IPCA_FORA_META', severidade: 'alerta', ehAlerta: true })
    expect(insight.texto).toContain('acima do teto da meta (4,50%) há 4 meses seguidos')
  })

  it('IPCA dentro da banda é informativo', () => {
    const ipca = serieMensal(2024, Array(15).fill('0.25'))
    const [insight] = gerarInsights(contexto({ series: { IPCA: ipca } }), [regra({ codigo: 'IPCA_FORA_META' })])
    expect(insight).toMatchObject({ severidade: 'informativo', ehAlerta: false, titulo: 'IPCA dentro da meta' })
  })

  it('regra inativa não gera insight', () => {
    const ipca = serieMensal(2024, [...IPCA_2024, '0.16', '1.31', '0.56'])
    expect(gerarInsights(contexto({ series: { IPCA: ipca } }), [regra({ codigo: 'IPCA_FORA_META', ativa: false })])).toEqual([])
  })

  it('movimento do dólar: exatamente no limite dispara, logo abaixo não', () => {
    const r = regra({ codigo: 'DOLAR_MOVIMENTO', limite: '5', severidade: 'alerta' })
    expect(gerarInsights(contexto({ series: { USD: dolarComVariacaoNoMes('5') } }), [r])).toHaveLength(1)
    expect(gerarInsights(contexto({ series: { USD: dolarComVariacaoNoMes('4.99') } }), [r])).toHaveLength(0)
    expect(gerarInsights(contexto({ series: { USD: dolarComVariacaoNoMes('-6') } }), [r])[0].titulo).toBe('Dólar em forte queda')
  })

  it('juro real: alto, baixo e neutro', () => {
    const r = regra({ codigo: 'JURO_REAL', limite: '6', limiteSecundario: '2' })
    const dados = (selic: string): Partial<DadosAnalise> => ({
      series: { SELIC_META: serieDiaria('2025-03-01', [selic]) },
      expectativas: [{ indicador: 'IPCA', referencia: '12M', dataColeta: '2025-03-28', mediana: '5' }],
    })
    expect(gerarInsights(contexto(dados('12')), [r])[0].titulo).toBe('Juro real elevado') // 6,67%
    expect(gerarInsights(contexto(dados('6')), [r])[0].titulo).toBe('Juro real baixo') // 0,95%
    expect(gerarInsights(contexto(dados('9')), [r])[0]).toMatchObject({ titulo: 'Juro real', ehAlerta: false })
  })

  it('ordena alertas antes de atenção e informativos', () => {
    const ipca = serieMensal(2024, [...IPCA_2024, '0.16', '1.31', '0.56'])
    const insights = gerarInsights(contexto({ series: { IPCA: ipca, USD: dolarComVariacaoNoMes('1') } }), [
      regra({ codigo: 'MAIORES_VARIACOES', severidade: 'informativo' }),
      regra({ codigo: 'IPCA_FORA_META', severidade: 'alerta' }),
    ])
    expect(insights.map((i) => i.severidade)).toEqual(['alerta', 'informativo'])
  })

  it('maiores variações lista os indicadores do período', () => {
    const ipca = serieMensal(2025, ['0.16', '1.31', '0.56'])
    const usd = [{ data: '2024-12-31', valor: '5' }, ...dolarComVariacaoNoMes('-3')]
    const [insight] = gerarInsights(contexto({ series: { IPCA: ipca, USD: usd } }), [
      regra({ codigo: 'MAIORES_VARIACOES' }),
    ])
    expect(insight.texto).toBe('De 01/2025 a 03/2025: Dólar -3,00%, IPCA +2,04%.')
  })

  it('insights públicos nunca são alertas', () => {
    const ipca = serieMensal(2024, [...IPCA_2024, '0.16', '1.31', '0.56'])
    const publicos = gerarInsightsPublicos(contexto({ series: { IPCA: ipca } }))
    expect(publicos.length).toBeGreaterThan(0)
    expect(publicos.every((i) => i.severidade === 'informativo' && !i.ehAlerta)).toBe(true)
  })
})
