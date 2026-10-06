/**
 * Limite simples de requisições por usuário, em memória. Em ambiente serverless cada instância
 * tem o seu contador, então é uma proteção contra abuso acidental, não uma cota exata.
 */
export function criarLimitador(maximo: number, janelaMs: number) {
  const registros = new Map<string, number[]>()
  return function permitir(chave: string, agora = Date.now()): boolean {
    const recentes = (registros.get(chave) ?? []).filter((t) => agora - t < janelaMs)
    if (recentes.length >= maximo) {
      registros.set(chave, recentes)
      return false
    }
    recentes.push(agora)
    registros.set(chave, recentes)
    return true
  }
}
