import type { Metadata } from 'next'
import { mesDe } from '@/lib/dominio/datas'
import { formatarPercentual, formatarPontos } from '@/lib/dominio/formatos'
import { decisoesNoPeriodo, graficoCdiAcumulado, graficoJuroReal, graficoSelic } from '@/lib/dominio/paineis/inflacao-juros'
import { carregarContextoPagina, insightsDe, type ParametrosBusca } from '@/lib/servicos/pagina'
import { CartaoGrafico } from '@/components/graficos/CartaoGrafico'
import { CabecalhoPagina } from '@/components/paineis/CabecalhoPagina'
import { FiltroPeriodo } from '@/components/paineis/FiltroPeriodo'
import { ListaInsights } from '@/components/paineis/ListaInsights'

export const metadata: Metadata = { title: 'Juros', description: 'Meta Selic, decisões do Copom, CDI e juro real.' }

export default async function PaginaJuros({ searchParams }: { searchParams: Promise<ParametrosBusca> }) {
  const ctx = await carregarContextoPagina(await searchParams)
  const decisoes = decisoesNoPeriodo(ctx.dados, ctx.filtros)
  return (
    <>
      <CabecalhoPagina titulo="Juros" descricao="Política monetária, CDI e juro real." atualizadoEm={ctx.atualizadoEm} buscaAssistente={ctx.busca} />
      <FiltroPeriodo filtros={ctx.filtros} mesMaximo={mesDe(ctx.hoje)} aviso={ctx.aviso} />
      <ListaInsights insights={insightsDe(ctx.insights, ['SELIC_META', 'CDI'])} />
      <div className="grade-larga">
        <CartaoGrafico dados={graficoSelic(ctx.dados, ctx.filtros)} nomeArquivo="selic" />
        <CartaoGrafico dados={graficoJuroReal(ctx.dados, ctx.filtros)} nomeArquivo="juro-real" />
        <CartaoGrafico dados={graficoCdiAcumulado(ctx.dados, ctx.filtros, ctx.referencia)} nomeArquivo="cdi-acumulado" />
        <section className="cartao" aria-labelledby="titulo-copom">
          <h2 id="titulo-copom">Decisões do Copom no período</h2>
          {decisoes.length === 0 ? (
            <p className="aviso aviso-info">A meta Selic não mudou no período selecionado.</p>
          ) : (
            <div className="rolagem-horizontal">
              <table className="tabela">
                <thead>
                  <tr>
                    <th scope="col">Vigência</th>
                    <th scope="col" className="numero">Meta Selic</th>
                    <th scope="col" className="numero">Mudança</th>
                  </tr>
                </thead>
                <tbody>
                  {decisoes.map((d) => (
                    <tr key={d.data}>
                      <th scope="row">{d.rotulo}</th>
                      <td className="numero">{formatarPercentual(d.taxa)}</td>
                      <td className={`numero ${d.variacaoPp.gt(0) ? 'negativo' : 'positivo'}`}>{formatarPontos(d.variacaoPp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  )
}
