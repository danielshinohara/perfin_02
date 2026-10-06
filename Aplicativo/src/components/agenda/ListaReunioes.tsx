import type { Reuniao } from '@/lib/google/eventos'
import { formatarData, formatarHora } from '@/lib/dominio/formatos'

const FORMATADOR_DIA = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'long' })

function chaveDoDia(r: Reuniao): string {
  return r.diaInteiro ? r.inicio.slice(0, 10) : new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date(r.inicio))
}

function agruparPorDia(reunioes: Reuniao[]): [string, Reuniao[]][] {
  const grupos = new Map<string, Reuniao[]>()
  for (const r of reunioes) grupos.set(chaveDoDia(r), [...(grupos.get(chaveDoDia(r)) ?? []), r])
  return [...grupos.entries()]
}

export function ListaReunioes({ reunioes }: { reunioes: Reuniao[] }) {
  if (reunioes.length === 0) return <p className="aviso aviso-info">Nenhuma reunião nos próximos 14 dias.</p>
  return (
    <div className="pilha">
      {agruparPorDia(reunioes).map(([dia, itens]) => (
        <section key={dia} className="cartao" aria-label={formatarData(dia)}>
          <h2>
            {formatarData(dia)} <span className="rotulo">{FORMATADOR_DIA.format(new Date(`${dia}T12:00:00-03:00`))}</span>
          </h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.75rem' }}>
            {itens.map((r) => (
              <li key={r.id} style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '0.75rem' }}>
                <span style={{ fontWeight: 700, color: 'var(--cor-texto)', fontVariantNumeric: 'tabular-nums' }}>
                  {r.diaInteiro ? 'Dia inteiro' : `${formatarHora(r.inicio)}–${formatarHora(r.fim)}`}
                </span>
                <span>
                  <strong style={{ color: 'var(--cor-texto)' }}>{r.titulo}</strong>
                  {r.local && <span style={{ display: 'block' }}>{r.local}</span>}
                  <span style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {r.linkVideo && (
                      <a href={r.linkVideo} target="_blank" rel="noopener noreferrer">
                        Entrar na videochamada
                      </a>
                    )}
                    {r.linkEvento && (
                      <a href={r.linkEvento} target="_blank" rel="noopener noreferrer">
                        Abrir no Google Agenda
                      </a>
                    )}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
