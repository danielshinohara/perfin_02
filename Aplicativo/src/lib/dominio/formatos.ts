import { Dec } from './numeros'
import type { DataISO, Mes } from './tipos'

const FUSO = 'America/Sao_Paulo'
type Numerico = Dec | string | number

function paraNumero(valor: Numerico, casas: number): number {
  // Arredonda em decimal antes de converter: o float é usado só para o Intl exibir.
  return new Dec(valor).toDecimalPlaces(casas).toNumber()
}

const cacheFormatadores = new Map<string, Intl.NumberFormat>()
function formatador(chave: string, opcoes: Intl.NumberFormatOptions): Intl.NumberFormat {
  let f = cacheFormatadores.get(chave)
  if (!f) {
    f = new Intl.NumberFormat('pt-BR', opcoes)
    cacheFormatadores.set(chave, f)
  }
  return f
}

export function formatarNumero(valor: Numerico, casas = 2, comSinal = false): string {
  return formatador(`n${casas}${comSinal}`, {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
    signDisplay: comSinal ? 'exceptZero' : 'auto',
  }).format(paraNumero(valor, casas))
}

/** `12.5` -> `12,50%` (o valor já está em %). */
export function formatarPercentual(valor: Numerico, casas = 2, comSinal = false): string {
  return `${formatarNumero(valor, casas, comSinal)}%`
}

export function formatarPontos(valor: Numerico, casas = 2): string {
  return `${formatarNumero(valor, casas, true)} p.p.`
}

export function formatarMoeda(valor: Numerico, casas = 2): string {
  return formatador(`m${casas}`, {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  }).format(paraNumero(valor, casas))
}

/** `2026-03-15` -> `15/03/2026` (sem conversão de fuso: a data já é de calendário). */
export function formatarData(data: DataISO): string {
  const [ano, mes, dia] = data.slice(0, 10).split('-')
  return `${dia}/${mes}/${ano}`
}

/** `2026-03` -> `03/2026`. */
export function formatarMesAno(mes: Mes): string {
  const [ano, m] = mes.split('-')
  return `${m}/${ano}`
}

const formatadorDataHora = new Intl.DateTimeFormat('pt-BR', {
  timeZone: FUSO,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

/** Instante -> `DD/MM/AAAA HH:mm` no horário de Brasília. */
export function formatarDataHora(instante: Date | string): string {
  return formatadorDataHora.format(new Date(instante)).replace(',', '')
}

const formatadorHora = new Intl.DateTimeFormat('pt-BR', {
  timeZone: FUSO,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

export function formatarHora(instante: Date | string): string {
  return formatadorHora.format(new Date(instante))
}
