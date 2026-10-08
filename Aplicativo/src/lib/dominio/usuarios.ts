import { SITUACOES, type Situacao } from '@/lib/auth/validacao'

export interface AcaoUsuario {
  /** Situação que a ação grava no perfil. */
  situacao: Exclude<Situacao, 'pendente'>
  rotulo: string
  principal: boolean
}

const RECUSAR: AcaoUsuario = { situacao: 'bloqueado', rotulo: 'Recusar', principal: false }

/**
 * Ações do admin para cada situação: aprovar/recusar pendentes, bloquear ativos, desbloquear bloqueados.
 * Quem não confirmou o e-mail não pode ser aprovado nem desbloqueado (o banco também recusa).
 */
export function acoesDisponiveis(situacao: Situacao, emailConfirmado: boolean): AcaoUsuario[] {
  switch (situacao) {
    case 'pendente':
      return emailConfirmado ? [{ situacao: 'ativo', rotulo: 'Aprovar', principal: true }, RECUSAR] : [RECUSAR]
    case 'ativo':
      return [{ situacao: 'bloqueado', rotulo: 'Bloquear', principal: false }]
    case 'bloqueado':
      return emailConfirmado ? [{ situacao: 'ativo', rotulo: 'Desbloquear', principal: false }] : []
  }
}

export const ROTULOS_SITUACAO: Record<Situacao, string> = {
  pendente: 'Aguardando aprovação',
  ativo: 'Ativos',
  bloqueado: 'Bloqueados',
}

/** Quantos usuários há em cada situação. */
export function contarPorSituacao(usuarios: { situacao: Situacao }[]): Record<Situacao, number> {
  const contagem = Object.fromEntries(SITUACOES.map((s) => [s, 0])) as Record<Situacao, number>
  for (const u of usuarios) contagem[u.situacao] += 1
  return contagem
}

/** Filtro da tela de usuários: o da URL, ou "pendente" se houver alguém aguardando, senão "ativo". */
export function filtroDeSituacao(valor: string | undefined, contagem: Record<Situacao, number>): Situacao {
  const escolhido = SITUACOES.find((s) => s === valor)
  if (escolhido) return escolhido
  return contagem.pendente > 0 ? 'pendente' : 'ativo'
}
