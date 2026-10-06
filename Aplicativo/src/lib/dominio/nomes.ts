import type { CodigoIndicador } from './tipos'

/** Nomes curtos dos indicadores para a interface (filtros, legendas e textos). */
export const NOMES_INDICADORES: Record<CodigoIndicador, string> = {
  IPCA: 'IPCA',
  IGPM: 'IGP-M',
  INPC: 'INPC',
  SELIC_META: 'Selic',
  CDI: 'CDI',
  USD: 'Dólar',
  EUR: 'Euro',
  IBCBR: 'IBC-Br',
  FBCF: 'FBCF',
  FBCF_REAL: 'FBCF real',
}
