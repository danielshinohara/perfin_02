import type { DadosGrafico } from '@/lib/dominio/paineis/tipos'
import { BotaoExportarCsv } from './BotaoExportarCsv'
import { Grafico } from './Grafico'
import { TabelaGrafico } from './TabelaGrafico'

interface Props {
  dados: DadosGrafico
  tipo?: 'linha' | 'barra'
  nomeArquivo: string
}

function temDados(dados: DadosGrafico): boolean {
  return dados.linhas.some((l) => dados.series.some((s) => typeof l[s.chave] === 'number'))
}

/** Gráfico com título, estado vazio, tabela acessível e exportação em CSV. */
export function CartaoGrafico({ dados, tipo = 'linha', nomeArquivo }: Props) {
  return (
    <section className="cartao" aria-labelledby={`titulo-${nomeArquivo}`}>
      <h2 id={`titulo-${nomeArquivo}`}>{dados.titulo}</h2>
      <p>{dados.descricao}</p>
      {temDados(dados) ? (
        <>
          <Grafico dados={dados} tipo={tipo} />
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '0.75rem' }}>
            <details style={{ flex: '1 1 100%' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 700, color: 'var(--cor-texto)' }}>Ver tabela</summary>
              <TabelaGrafico dados={dados} />
            </details>
            <BotaoExportarCsv dados={dados} nomeArquivo={nomeArquivo} />
          </div>
        </>
      ) : (
        <p className="aviso aviso-info">Sem dados para o período e os indicadores selecionados.</p>
      )}
    </section>
  )
}
