import type { Metadata } from 'next'
import { mesDe } from '@/lib/dominio/datas'
import { formatarData, formatarMoeda, formatarPercentual } from '@/lib/dominio/formatos'
import { graficoCambio, graficoVolatilidade, resumoCambio } from '@/lib/dominio/paineis/mercado'
import { carregarContextoPagina, insightsDe, type ParametrosBusca } from '@/lib/servicos/pagina'
import { CartaoGrafico } from '@/components/graficos/CartaoGrafico'
import { CabecalhoPagina } from '@/components/paineis/CabecalhoPagina'
import { FiltroPeriodo } from '@/components/paineis/FiltroPeriodo'
import { ListaInsights } from '@/components/paineis/ListaInsights'

export const metadata: Metadata = { title: 'Câmbio', description: 'Dólar e euro PTAX: cotações, variações e volatilidade.' }

export default async function PaginaCambio({ searchParams }: { searchParams: Promise<ParametrosBusca> }) {
  const ctx = await carregarContextoPagina(await searchParams)
  const resumos = resumoCambio(ctx.dados, ctx.filtros, ctx.referencia)
  return (
    <>
      <CabecalhoPagina titulo="Câmbio" descricao="Cotações PTAX de venda do Banco Central." atualizadoEm={ctx.atualizadoEm} buscaAssistente={ctx.busca} />
      <FiltroPeriodo filtros={ctx.filtros} mesMaximo={mesDe(ctx.hoje)} opcoes={['USD', 'EUR']} aviso={ctx.aviso} />
      <section className="grade" aria-label="Resumo do período">
        {resumos.map((r) => (
          <article key={r.codigo} className="cartao">
            <h2 className="rotulo">{r.nome} no período</h2>
            {r.estatisticas ? (
              <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.25rem 1rem', margin: 0 }}>
                <dt>Variação</dt>
                <dd style={{ margin: 0, fontWeight: 700, color: 'var(--cor-texto)' }}>{r.variacaoPeriodo ? formatarPercentual(r.variacaoPeriodo, 2, true) : '—'}</dd>
                <dt>Média</dt>
                <dd style={{ margin: 0 }}>{formatarMoeda(r.estatisticas.media, 4)}</dd>
                <dt>Máxima</dt>
                <dd style={{ margin: 0 }}>{formatarMoeda(r.estatisticas.maxima.valor, 4)} em {formatarData(r.estatisticas.maxima.data)}</dd>
                <dt>Mínima</dt>
                <dd style={{ margin: 0 }}>{formatarMoeda(r.estatisticas.minima.valor, 4)} em {formatarData(r.estatisticas.minima.data)}</dd>
              </dl>
            ) : (
              <p className="aviso aviso-info">Sem cotações no período.</p>
            )}
          </article>
        ))}
      </section>
      <ListaInsights insights={insightsDe(ctx.insights, ['USD', 'EUR'])} />
      <div className="grade-larga">
        <CartaoGrafico dados={graficoCambio(ctx.dados, ctx.filtros, ctx.referencia)} nomeArquivo="cambio" />
        <CartaoGrafico dados={graficoVolatilidade(ctx.dados, ctx.filtros, ctx.referencia)} nomeArquivo="volatilidade-dolar" />
      </div>
    </>
  )
}
