import type { DataISO, Mes, Ponto } from './tipos'

/** `2026-03-15` -> `2026-03`. */
export function mesDe(data: DataISO): Mes {
  return data.slice(0, 7)
}

export function anoDe(dataOuMes: string): number {
  return Number(dataOuMes.slice(0, 4))
}

export function primeiroDia(mes: Mes): DataISO {
  return `${mes}-01`
}

export function ultimoDia(mes: Mes): DataISO {
  const [ano, m] = mes.split('-').map(Number)
  const dia = new Date(Date.UTC(ano, m, 0)).getUTCDate()
  return `${mes}-${String(dia).padStart(2, '0')}`
}

export function somarMeses(mes: Mes, quantidade: number): Mes {
  const [ano, m] = mes.split('-').map(Number)
  const total = ano * 12 + (m - 1) + quantidade
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`
}

/** Lista os meses entre `inicio` e `fim`, inclusive. */
export function listarMeses(inicio: Mes, fim: Mes): Mes[] {
  const meses: Mes[] = []
  for (let mes = inicio; mes <= fim; mes = somarMeses(mes, 1)) meses.push(mes)
  return meses
}

export function somarDias(data: DataISO, dias: number): DataISO {
  const d = new Date(`${data}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + dias)
  return d.toISOString().slice(0, 10)
}

/** Mesma data um ano antes; 29/02 vira 28/02. */
export function mesmoDiaAnoAnterior(data: DataISO): DataISO {
  const [ano, mes, dia] = data.split('-').map(Number)
  const ultimo = new Date(Date.UTC(ano - 1, mes, 0)).getUTCDate()
  return `${ano - 1}-${String(mes).padStart(2, '0')}-${String(Math.min(dia, ultimo)).padStart(2, '0')}`
}

/** Segunda-feira da semana da data (para agrupar o Focus por semana). */
export function inicioDaSemana(data: DataISO): DataISO {
  const diaSemana = new Date(`${data}T00:00:00Z`).getUTCDay()
  return somarDias(data, -((diaSemana + 6) % 7))
}

/** Último ponto com data <= `data` (séries ordenadas). */
export function ultimoPontoAte(serie: Ponto[], data: DataISO): Ponto | undefined {
  let resultado: Ponto | undefined
  for (const ponto of serie) {
    if (ponto.data > data) break
    resultado = ponto
  }
  return resultado
}

export function pontosEntre(serie: Ponto[], inicio: DataISO, fim: DataISO): Ponto[] {
  return serie.filter((p) => p.data >= inicio && p.data <= fim)
}

/** Data de hoje no fuso de São Paulo, em ISO. */
export function hojeEmSaoPaulo(agora: Date = new Date()): DataISO {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(agora)
}
