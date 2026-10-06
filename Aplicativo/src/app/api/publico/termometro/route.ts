import { hojeEmSaoPaulo } from '@/lib/dominio/datas'
import { montarTermometroPublico } from '@/lib/servicos/termometro-publico'

export const dynamic = 'force-dynamic'

/** API pública (sem login) consumida pelo Website. Só dados públicos do BCB/IBGE, com cache de 1 hora na CDN. */
export async function GET() {
  try {
    const termometro = await montarTermometroPublico(hojeEmSaoPaulo())
    return Response.json(termometro, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
    })
  } catch (erro) {
    console.error('[termometro-publico]', erro instanceof Error ? erro.message : 'erro desconhecido')
    return Response.json({ erro: 'Indicadores indisponíveis no momento.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}
