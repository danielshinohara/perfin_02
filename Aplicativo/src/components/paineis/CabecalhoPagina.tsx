import Link from 'next/link'
import { formatarDataHora } from '@/lib/dominio/formatos'

interface Props {
  titulo: string
  descricao: string
  atualizadoEm?: string | null
  /** Query string dos filtros, para abrir o assistente no mesmo contexto. */
  buscaAssistente?: string
}

export function CabecalhoPagina({ titulo, descricao, atualizadoEm, buscaAssistente }: Props) {
  return (
    <header style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'flex-end' }}>
      <div>
        <h1>{titulo}</h1>
        <p style={{ margin: 0 }}>{descricao}</p>
        {atualizadoEm !== undefined && (
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem' }}>
            {atualizadoEm ? `Dados atualizados em ${formatarDataHora(atualizadoEm)} · Fontes: BCB e IBGE` : 'Ainda não há dados carregados.'}
          </p>
        )}
      </div>
      {buscaAssistente !== undefined && (
        <Link className="botao botao-secundario" href={`/assistente?${buscaAssistente}`}>
          Perguntar ao assistente
        </Link>
      )}
    </header>
  )
}
