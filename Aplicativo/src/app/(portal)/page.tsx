import type { Metadata } from 'next'
import { mesDe } from '@/lib/dominio/datas'
import { graficoInflacao12m } from '@/lib/dominio/paineis/inflacao-juros'
import { kpisTermometro } from '@/lib/dominio/resumo'
import { carregarContextoPagina, type ParametrosBusca } from '@/lib/servicos/pagina'
import { CartaoGrafico } from '@/components/graficos/CartaoGrafico'
import { CabecalhoPagina } from '@/components/paineis/CabecalhoPagina'
import { CartaoKpi } from '@/components/paineis/CartaoKpi'
import { FiltroPeriodo } from '@/components/paineis/FiltroPeriodo'
import { ListaInsights } from '@/components/paineis/ListaInsights'

export const metadata: Metadata = { title: 'Visão geral', description: 'Termômetro da economia: principais indicadores, alertas e insights.' }

const INSIGHTS_NA_VISAO_GERAL = 5

export default async function PaginaVisaoGeral({ searchParams }: { searchParams: Promise<ParametrosBusca> }) {
  const ctx = await carregarContextoPagina(await searchParams)
  const kpis = kpisTermometro(ctx.dados, ctx.referencia)
  const alertas = ctx.insights.filter((i) => i.ehAlerta)
  const demais = ctx.insights.filter((i) => !i.ehAlerta)

  return (
    <>
      <CabecalhoPagina
        titulo="Visão geral"
        descricao="O termômetro da economia: inflação, juros, câmbio e atividade."
        atualizadoEm={ctx.atualizadoEm}
        buscaAssistente={ctx.busca}
      />
      <FiltroPeriodo filtros={ctx.filtros} mesMaximo={mesDe(ctx.hoje)} aviso={ctx.aviso} />
      <section aria-label="Indicadores principais" className="grade">
        {kpis.map((kpi) => (
          <CartaoKpi key={kpi.id} kpi={kpi} />
        ))}
      </section>
      {alertas.length > 0 && <ListaInsights titulo="Alertas ativos" insights={alertas} />}
      <ListaInsights titulo="Insights" insights={demais} limite={INSIGHTS_NA_VISAO_GERAL} />
      <CartaoGrafico dados={graficoInflacao12m(ctx.dados, { ...ctx.filtros, indicadores: ['IPCA'] })} nomeArquivo="ipca-12m-meta" />
    </>
  )
}
