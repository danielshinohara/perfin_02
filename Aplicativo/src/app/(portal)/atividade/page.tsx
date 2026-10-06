import type { Metadata } from 'next'
import { mesDe } from '@/lib/dominio/datas'
import { graficoFbcf, graficoIbcBr, graficoIbcBrNivel } from '@/lib/dominio/paineis/mercado'
import { carregarContextoPagina, insightsDe, type ParametrosBusca } from '@/lib/servicos/pagina'
import { CartaoGrafico } from '@/components/graficos/CartaoGrafico'
import { CabecalhoPagina } from '@/components/paineis/CabecalhoPagina'
import { FiltroPeriodo } from '@/components/paineis/FiltroPeriodo'
import { ListaInsights } from '@/components/paineis/ListaInsights'

export const metadata: Metadata = { title: 'Atividade', description: 'IBC-Br (prévia do PIB) e investimento (FBCF).' }

export default async function PaginaAtividade({ searchParams }: { searchParams: Promise<ParametrosBusca> }) {
  const ctx = await carregarContextoPagina(await searchParams)
  return (
    <>
      <CabecalhoPagina
        titulo="Atividade econômica"
        descricao="IBC-Br, a prévia mensal do PIB, e a formação bruta de capital fixo (investimento)."
        atualizadoEm={ctx.atualizadoEm}
        buscaAssistente={ctx.busca}
      />
      <FiltroPeriodo filtros={ctx.filtros} mesMaximo={mesDe(ctx.hoje)} aviso={ctx.aviso} />
      <ListaInsights insights={insightsDe(ctx.insights, ['IBCBR', 'FBCF', 'FBCF_REAL'])} />
      <div className="grade-larga">
        <CartaoGrafico dados={graficoIbcBr(ctx.dados, ctx.filtros)} nomeArquivo="ibcbr-12m" />
        <CartaoGrafico dados={graficoIbcBrNivel(ctx.dados, ctx.filtros)} nomeArquivo="ibcbr-nivel" />
        <CartaoGrafico dados={graficoFbcf(ctx.dados, ctx.filtros)} tipo="barra" nomeArquivo="fbcf" />
      </div>
    </>
  )
}
