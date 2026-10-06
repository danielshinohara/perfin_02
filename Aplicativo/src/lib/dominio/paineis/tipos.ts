/** Linha de dados de um gráfico: rótulo do eixo X + valores numéricos por série (null = sem dado). */
export type LinhaGrafico = { rotulo: string } & Record<string, string | number | null>

export interface SerieGrafico {
  chave: string
  nome: string
}

export type UnidadeGrafico = 'percentual' | 'moeda' | 'indice' | 'pontos'

export interface DadosGrafico {
  titulo: string
  descricao: string
  unidade: UnidadeGrafico
  series: SerieGrafico[]
  linhas: LinhaGrafico[]
  /** Faixa sombreada (ex.: banda da meta), usando chaves das linhas. */
  faixa?: { inferior: string; superior: string; nome: string }
}
