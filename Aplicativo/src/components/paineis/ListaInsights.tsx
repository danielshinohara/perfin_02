import type { Insight, Severidade } from '@/lib/dominio/tipos'
import { formatarData } from '@/lib/dominio/formatos'

const ESTILO: Record<Severidade, { classe: string; icone: string; rotulo: string }> = {
  alerta: { classe: 'aviso-alerta', icone: '▲', rotulo: 'Alerta' },
  atencao: { classe: 'aviso-atencao', icone: '◆', rotulo: 'Atenção' },
  informativo: { classe: 'aviso-info', icone: '●', rotulo: 'Informativo' },
}

interface Props {
  insights: Insight[]
  titulo?: string
  limite?: number
}

export function ListaInsights({ insights, titulo = 'Insights', limite }: Props) {
  const visiveis = limite ? insights.slice(0, limite) : insights
  const idTitulo = `titulo-${titulo.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-')}`
  return (
    <section aria-labelledby={idTitulo} className="pilha" style={{ gap: '0.75rem' }}>
      <h2 id={idTitulo}>{titulo}</h2>
      {visiveis.length === 0 ? (
        <p className="aviso aviso-info">Nenhum insight para o período selecionado.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.75rem' }}>
          {visiveis.map((i) => {
            const estilo = ESTILO[i.severidade]
            return (
              <li key={`${i.regra}-${i.dataReferencia}`} className={`aviso ${estilo.classe}`}>
                <strong>
                  <span aria-hidden="true">{estilo.icone}</span> {estilo.rotulo} · {i.titulo}
                </strong>
                <p style={{ margin: '0.25rem 0 0', color: 'var(--cor-texto)' }}>{i.texto}</p>
                <small>Ref. {formatarData(i.dataReferencia)}</small>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
