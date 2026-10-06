import type { Termometro } from '@/lib/termometro'
import { MiniGrafico } from './MiniGrafico'

const NUMERO = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const MOEDA = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 4 })

function formatador(unidade: 'percentual' | 'moeda') {
  return unidade === 'moeda' ? (v: number) => MOEDA.format(v) : (v: number) => `${NUMERO.format(v)}%`
}

function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}

export function SecaoTermometro({ termometro }: { termometro: Termometro | null }) {
  return (
    <section id="termometro" className="secao" aria-labelledby="titulo-termometro">
      <div className="conteiner" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div>
          <span className="rotulo">Termômetro da economia</span>
          <h2 id="titulo-termometro">Os números que movem os investimentos</h2>
          {termometro && (
            <p>
              Atualizado em {formatarData(termometro.atualizadoEm)} · Fonte: {termometro.fonte}
            </p>
          )}
        </div>
        {!termometro ? (
          <p className="cartao" role="status">
            Os indicadores estão temporariamente indisponíveis. Tente novamente em alguns minutos.
          </p>
        ) : (
          <>
            <div className="grade">
              {termometro.indicadores.map((i) => (
                <article key={i.id} className="cartao">
                  <h3 className="rotulo" style={{ color: 'var(--cor-texto-2)' }}>
                    {i.titulo}
                  </h3>
                  <p style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--cor-texto)', margin: 0 }}>{i.valorFormatado}</p>
                  {i.complemento && <p style={{ margin: 0, fontSize: '0.875rem' }}>{i.complemento}</p>}
                  {i.referencia && <p style={{ margin: 0, fontSize: '0.8125rem' }}>Ref. {i.referencia}</p>}
                </article>
              ))}
            </div>
            {termometro.insights.length > 0 && (
              <ul className="grade" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {termometro.insights.map((i) => (
                  <li key={i.titulo} className="cartao">
                    <strong style={{ color: 'var(--cor-texto)' }}>{i.titulo}</strong>
                    <p style={{ margin: '0.5rem 0 0' }}>{i.texto}</p>
                  </li>
                ))}
              </ul>
            )}
            <div className="grade">
              {termometro.graficos.map((g) => (
                <article key={g.id} className="cartao">
                  <h3 style={{ fontSize: '1rem' }}>{g.titulo}</h3>
                  <MiniGrafico titulo={g.titulo} pontos={g.pontos} formatar={formatador(g.unidade)} />
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
