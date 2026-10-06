export interface EventoGoogle {
  id: string
  status?: string
  summary?: string
  location?: string
  htmlLink?: string
  hangoutLink?: string
  start?: { dateTime?: string; date?: string }
  end?: { dateTime?: string; date?: string }
  conferenceData?: { entryPoints?: { entryPointType?: string; uri?: string }[] }
}

export interface Reuniao {
  id: string
  titulo: string
  /** Data e hora ISO (ou data `AAAA-MM-DD` quando é de dia inteiro). */
  inicio: string
  fim: string
  diaInteiro: boolean
  local: string | null
  linkVideo: string | null
  linkEvento: string | null
}

function linkDeVideo(evento: EventoGoogle): string | null {
  const video = evento.conferenceData?.entryPoints?.find((e) => e.entryPointType === 'video')?.uri
  return video ?? evento.hangoutLink ?? null
}

/** Só aceita links https, para não renderizar esquemas perigosos vindos do evento. */
function linkSeguro(url: string | null | undefined): string | null {
  return url && url.startsWith('https://') ? url : null
}

export function converterEvento(evento: EventoGoogle): Reuniao {
  const diaInteiro = !evento.start?.dateTime
  return {
    id: evento.id,
    titulo: evento.summary?.trim() || '(sem título)',
    inicio: evento.start?.dateTime ?? evento.start?.date ?? '',
    fim: evento.end?.dateTime ?? evento.end?.date ?? '',
    diaInteiro,
    local: evento.location?.trim() || null,
    linkVideo: linkSeguro(linkDeVideo(evento)),
    linkEvento: linkSeguro(evento.htmlLink),
  }
}
