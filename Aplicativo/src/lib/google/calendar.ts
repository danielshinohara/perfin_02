import 'server-only'
import { chamarGoogleJson } from './http'
import { converterEvento, type EventoGoogle, type Reuniao } from './eventos'

const DIAS_A_FRENTE = 14
const MAXIMO_EVENTOS = 15

/** Próximas reuniões do calendário principal do usuário logado. */
export async function listarProximasReunioes(accessToken: string, agora: Date): Promise<Reuniao[]> {
  const fim = new Date(agora.getTime() + DIAS_A_FRENTE * 24 * 60 * 60 * 1000)
  const parametros = new URLSearchParams({
    timeMin: agora.toISOString(),
    timeMax: fim.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: String(MAXIMO_EVENTOS),
    timeZone: 'America/Sao_Paulo',
  })
  const resposta = await chamarGoogleJson<{ items?: EventoGoogle[] }>(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${parametros}`,
    accessToken,
  )
  return (resposta.items ?? []).filter((e) => e.status !== 'cancelled').map(converterEvento)
}
