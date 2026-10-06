const ROTAS_PUBLICAS = ['/login', '/acesso-negado', '/offline']
const PREFIXOS_PUBLICOS = ['/auth/', '/api/publico/']

/** Rotas acessíveis sem login (todas as demais exigem sessão). */
export function ehRotaPublica(caminho: string): boolean {
  return ROTAS_PUBLICAS.includes(caminho) || PREFIXOS_PUBLICOS.some((prefixo) => caminho.startsWith(prefixo))
}
