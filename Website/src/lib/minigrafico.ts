export interface PontoGrafico {
  mes: string
  valor: number | null
}

export interface Geometria {
  caminho: string
  minimo: number
  maximo: number
  ultimo: { x: number; y: number } | null
}

/** Converte a série em um caminho SVG (linha), ignorando meses sem dado. */
export function geometriaLinha(pontos: PontoGrafico[], largura: number, altura: number, margem = 6): Geometria | null {
  const validos = pontos.map((p, i) => ({ i, v: p.valor })).filter((p): p is { i: number; v: number } => p.v !== null)
  if (validos.length < 2) return null
  const valores = validos.map((p) => p.v)
  const minimo = Math.min(...valores)
  const maximo = Math.max(...valores)
  const amplitude = maximo - minimo || 1
  const x = (i: number) => margem + (i / Math.max(pontos.length - 1, 1)) * (largura - margem * 2)
  const y = (v: number) => margem + (1 - (v - minimo) / amplitude) * (altura - margem * 2)
  const caminho = validos.map((p, k) => `${k === 0 ? 'M' : 'L'}${x(p.i).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ')
  const ultimo = validos.at(-1)!
  return { caminho, minimo, maximo, ultimo: { x: x(ultimo.i), y: y(ultimo.v) } }
}
