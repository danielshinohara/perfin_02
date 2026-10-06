import type { Metadata } from 'next'
import { mesDe } from '@/lib/dominio/datas'
import {
  graficoEsperadoRealizado,
  graficoInflacao12m,
  graficoInflacaoMensal,
  graficoSpread,
} from '@/lib/dominio/paineis/inflacao-juros'
import { carregarContextoPagina, insightsDe, type ParametrosBusca } from '@/lib/servicos/pagina'
import { CartaoGrafico } from '@/components/graficos/CartaoGrafico'
import { CabecalhoPagina } from '@/components/paineis/CabecalhoPagina'
import { FiltroPeriodo } from '@/components/paineis/FiltroPeriodo'
import { ListaInsights } from '@/components/paineis/ListaInsights'

export const metadata: Metadata = { title: 'Inflação', description: 'IPCA, IGP-M e INPC: variação mensal, acumulado em 12 meses e meta.' }

export default async function PaginaInflacao({ searchParams }: { searchParams: Promise<ParametrosBusca> }) {
  const ctx = await carregarContextoPagina(await searchParams)
  return (
    <>
      <CabecalhoPagina
        titulo="Inflação"
        descricao="IPCA, IGP-M e INPC no mês e em 12 meses, comparados à meta de inflação."
        atualizadoEm={ctx.atualizadoEm}
        buscaAssistente={ctx.busca}
      />
      <FiltroPeriodo filtros={ctx.filtros} mesMaximo={mesDe(ctx.hoje)} opcoes={['IPCA', 'IGPM', 'INPC']} aviso={ctx.aviso} />
      <ListaInsights insights={insightsDe(ctx.insights, ['IPCA', 'IGPM', 'INPC'])} />
      <div className="grade-larga">
        <CartaoGrafico dados={graficoInflacao12m(ctx.dados, ctx.filtros)} nomeArquivo="inflacao-12m" />
        <CartaoGrafico dados={graficoInflacaoMensal(ctx.dados, ctx.filtros)} tipo="barra" nomeArquivo="inflacao-mensal" />
        <CartaoGrafico dados={graficoSpread(ctx.dados, ctx.filtros)} nomeArquivo="spread-igpm-ipca" />
        <CartaoGrafico dados={graficoEsperadoRealizado(ctx.dados, ctx.filtros, ctx.referencia)} tipo="barra" nomeArquivo="ipca-esperado-realizado" />
      </div>
    </>
  )
}
