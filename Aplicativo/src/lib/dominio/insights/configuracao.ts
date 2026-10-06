import type { CodigoRegra } from '../tipos'

/** Regras que não usam limite numérico (são sempre informativas ou usam a banda da meta). */
export const REGRAS_SEM_LIMITE: readonly CodigoRegra[] = ['IPCA_FORA_META', 'CDI_REAL', 'MAIORES_VARIACOES']

/** Regras que têm um segundo limite (inferior). */
export const REGRAS_COM_LIMITE_INFERIOR: readonly CodigoRegra[] = ['JURO_REAL']

export const LIMITE_MAXIMO_ABSOLUTO = 1_000_000

export function usaLimite(codigo: CodigoRegra): boolean {
  return !REGRAS_SEM_LIMITE.includes(codigo)
}
