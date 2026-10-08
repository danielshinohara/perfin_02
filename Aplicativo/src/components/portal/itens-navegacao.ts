export interface ItemNavegacao {
  href: string
  rotulo: string
}

export const ITENS_PAINEIS: ItemNavegacao[] = [
  { href: '/', rotulo: 'Visão geral' },
  { href: '/inflacao', rotulo: 'Inflação' },
  { href: '/juros', rotulo: 'Juros' },
  { href: '/cambio', rotulo: 'Câmbio' },
  { href: '/atividade', rotulo: 'Atividade' },
  { href: '/expectativas', rotulo: 'Expectativas' },
]

export const ITENS_FERRAMENTAS: ItemNavegacao[] = [
  { href: '/calculadora', rotulo: 'Calculadora de correção' },
  { href: '/relatorios', rotulo: 'Relatórios' },
  { href: '/agenda', rotulo: 'Agenda' },
  { href: '/assistente', rotulo: 'Assistente' },
]

const ITENS_ADMIN: ItemNavegacao[] = [
  { href: '/admin/usuarios', rotulo: 'Usuários' },
  { href: '/admin/alertas', rotulo: 'Alertas' },
]

/** Itens de administração; "Usuários" mostra quantos cadastros aguardam aprovação. */
export function itensAdmin(pendentes: number): ItemNavegacao[] {
  if (pendentes <= 0) return [...ITENS_ADMIN]
  const sufixo = ` (${pendentes} pendente${pendentes > 1 ? 's' : ''})`
  return ITENS_ADMIN.map((item) => (item.href === '/admin/usuarios' ? { ...item, rotulo: item.rotulo + sufixo } : item))
}

export const ITENS_CELULAR: ItemNavegacao[] = [
  { href: '/', rotulo: 'Visão geral' },
  { href: '/paineis', rotulo: 'Painéis' },
  { href: '/relatorios', rotulo: 'Relatórios' },
  { href: '/agenda', rotulo: 'Agenda' },
  { href: '/assistente', rotulo: 'Assistente' },
]
