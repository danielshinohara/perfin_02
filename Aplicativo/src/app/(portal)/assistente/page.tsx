import type { Metadata } from 'next'
import { hojeEmSaoPaulo, mesDe } from '@/lib/dominio/datas'
import { formatarMesAno } from '@/lib/dominio/formatos'
import { filtrosParaBusca, lerFiltros } from '@/lib/dominio/periodo'
import { CODIGOS_INDICADORES } from '@/lib/dominio/tipos'
import type { ParametrosBusca } from '@/lib/servicos/pagina'
import { CabecalhoPagina } from '@/components/paineis/CabecalhoPagina'
import { FiltroPeriodo } from '@/components/paineis/FiltroPeriodo'
import { ChatAssistente } from '@/components/assistente/ChatAssistente'

export const metadata: Metadata = { title: 'Assistente', description: 'Pergunte sobre os indicadores do período filtrado.' }

export default async function PaginaAssistente({ searchParams }: { searchParams: Promise<ParametrosBusca> }) {
  const hoje = hojeEmSaoPaulo()
  const { filtros, aviso } = lerFiltros(await searchParams, hoje)
  const busca = filtrosParaBusca(filtros)
  return (
    <>
      <CabecalhoPagina
        titulo="Assistente"
        descricao={`Responde com base nos indicadores de ${formatarMesAno(filtros.inicio)} a ${formatarMesAno(filtros.fim)}. Não faz recomendação de investimento.`}
      />
      <FiltroPeriodo filtros={filtros} mesMaximo={mesDe(hoje)} opcoes={[...CODIGOS_INDICADORES]} aviso={aviso} />
      {/* A chave reinicia a conversa quando o filtro muda, para não misturar contextos. */}
      <ChatAssistente key={busca} busca={busca} />
    </>
  )
}
