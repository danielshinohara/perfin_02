import type { Metadata } from 'next'
import { mesDe } from '@/lib/dominio/datas'
import { inflacaoDoAno } from '@/lib/dominio/expectativas'
import { formatarData, formatarMesAno, formatarPercentual } from '@/lib/dominio/formatos'
import { graficoFocus } from '@/lib/dominio/paineis/mercado'
import { carregarContextoPagina, type ParametrosBusca } from '@/lib/servicos/pagina'
import type { IndicadorFocus } from '@/lib/dominio/tipos'
import { CartaoGrafico } from '@/components/graficos/CartaoGrafico'
import { CabecalhoPagina } from '@/components/paineis/CabecalhoPagina'
import { FiltroPeriodo } from '@/components/paineis/FiltroPeriodo'
import { ListaInsights } from '@/components/paineis/ListaInsights'

export const metadata: Metadata = { title: 'Expectativas', description: 'Boletim Focus: projeções do mercado para inflação, Selic, câmbio e PIB.' }

const INDICADORES: IndicadorFocus[] = ['IPCA', 'SELIC', 'CAMBIO', 'PIB']

export default async function PaginaExpectativas({ searchParams }: { searchParams: Promise<ParametrosBusca> }) {
  const ctx = await carregarContextoPagina(await searchParams)
  const inflacao = inflacaoDoAno(ctx.dados.expectativas, ctx.dados.series.IPCA ?? [], ctx.referencia)
  return (
    <>
      <CabecalhoPagina
        titulo="Expectativas (Focus)"
        descricao="Mediana das projeções do mercado coletadas pelo Banco Central."
        atualizadoEm={ctx.atualizadoEm}
        buscaAssistente={ctx.busca}
      />
      <FiltroPeriodo filtros={ctx.filtros} mesMaximo={mesDe(ctx.hoje)} aviso={ctx.aviso} />
      {inflacao && (
        <section className="cartao" aria-labelledby="titulo-inflacao-ano">
          <h2 id="titulo-inflacao-ano">IPCA {inflacao.ano}: esperado × já acumulado</h2>
          <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '1rem', margin: 0 }}>
            <div>
              <dt className="rotulo">Esperado no ano (Focus)</dt>
              <dd style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--cor-texto)' }}>{formatarPercentual(inflacao.esperado)}</dd>
              <dd style={{ margin: 0, fontSize: '0.8125rem' }}>coleta de {formatarData(inflacao.dataColeta)}</dd>
            </div>
            <div>
              <dt className="rotulo">Acumulado até {formatarMesAno(inflacao.mesAcumulado)}</dt>
              <dd style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--cor-texto)' }}>{formatarPercentual(inflacao.acumulado)}</dd>
            </div>
            <div>
              <dt className="rotulo">Implícito no restante do ano</dt>
              <dd style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--cor-texto)' }}>{formatarPercentual(inflacao.restante)}</dd>
            </div>
          </dl>
        </section>
      )}
      <ListaInsights insights={ctx.insights.filter((i) => i.regra === 'FOCUS_REVISOES' || i.regra === 'JURO_REAL')} />
      <div className="grade-larga">
        {INDICADORES.map((indicador) => (
          <CartaoGrafico
            key={indicador}
            dados={graficoFocus(ctx.dados, indicador, ctx.filtros, ctx.referencia)}
            nomeArquivo={`focus-${indicador.toLowerCase()}`}
          />
        ))}
      </div>
    </>
  )
}
