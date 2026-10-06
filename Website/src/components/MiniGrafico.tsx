import { geometriaLinha, type PontoGrafico } from '@/lib/minigrafico'

const LARGURA = 320
const ALTURA = 96

interface Props {
  titulo: string
  pontos: PontoGrafico[]
  formatar: (valor: number) => string
}

/** Linha simples em SVG (sem JavaScript no navegador), com tabela acessível. */
export function MiniGrafico({ titulo, pontos, formatar }: Props) {
  const geometria = geometriaLinha(pontos, LARGURA, ALTURA)
  if (!geometria) return <p>Sem dados suficientes.</p>
  const primeiro = pontos.find((p) => p.valor !== null)
  const ultimo = [...pontos].reverse().find((p) => p.valor !== null)
  return (
    <figure style={{ margin: 0 }}>
      <svg viewBox={`0 0 ${LARGURA} ${ALTURA}`} width="100%" role="img" aria-label={`${titulo}: de ${primeiro?.mes} a ${ultimo?.mes}`}>
        <path d={geometria.caminho} fill="none" stroke="var(--serie-1)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {geometria.ultimo && <circle cx={geometria.ultimo.x} cy={geometria.ultimo.y} r={4} fill="var(--serie-1)" stroke="var(--cor-superficie)" strokeWidth={2} />}
      </svg>
      <figcaption style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
        <span>{primeiro?.mes}</span>
        <span>
          mín. {formatar(geometria.minimo)} · máx. {formatar(geometria.maximo)}
        </span>
        <span>{ultimo?.mes}</span>
      </figcaption>
      <details>
        <summary style={{ cursor: 'pointer', fontSize: '0.875rem' }}>Ver valores</summary>
        <table style={{ width: '100%', fontSize: '0.8125rem', borderCollapse: 'collapse' }}>
          <caption className="sr-only">{titulo}</caption>
          <tbody>
            {pontos.map((p) => (
              <tr key={p.mes}>
                <th scope="row" style={{ textAlign: 'left', fontWeight: 400 }}>
                  {p.mes}
                </th>
                <td style={{ textAlign: 'right' }}>{p.valor === null ? '—' : formatar(p.valor)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  )
}
