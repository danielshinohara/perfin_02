import { describe, expect, it } from 'vitest'
import { acoesDisponiveis, contarPorSituacao, filtroDeSituacao } from './usuarios'

describe('ações do admin por situação', () => {
  it('pendente com e-mail confirmado: aprovar (principal) ou recusar', () => {
    expect(acoesDisponiveis('pendente', true)).toEqual([
      { situacao: 'ativo', rotulo: 'Aprovar', principal: true },
      { situacao: 'bloqueado', rotulo: 'Recusar', principal: false },
    ])
  })

  it('pendente sem e-mail confirmado: só recusar (não dá para aprovar)', () => {
    expect(acoesDisponiveis('pendente', false)).toEqual([{ situacao: 'bloqueado', rotulo: 'Recusar', principal: false }])
  })

  it('ativo: só bloquear; bloqueado: só desbloquear (se o e-mail estiver confirmado)', () => {
    expect(acoesDisponiveis('ativo', true)).toEqual([{ situacao: 'bloqueado', rotulo: 'Bloquear', principal: false }])
    expect(acoesDisponiveis('bloqueado', true)).toEqual([{ situacao: 'ativo', rotulo: 'Desbloquear', principal: false }])
    expect(acoesDisponiveis('bloqueado', false)).toEqual([])
  })

  it('nenhuma ação volta o usuário para pendente nem mantém a mesma situação', () => {
    for (const situacao of ['pendente', 'ativo', 'bloqueado'] as const) {
      for (const acao of [...acoesDisponiveis(situacao, true), ...acoesDisponiveis(situacao, false)]) {
        expect(acao.situacao).not.toBe('pendente')
        expect(acao.situacao).not.toBe(situacao)
      }
    }
  })
})

describe('contagem por situação', () => {
  it('lista vazia zera todas as situações', () => {
    expect(contarPorSituacao([])).toEqual({ pendente: 0, ativo: 0, bloqueado: 0 })
  })

  it('um único usuário', () => {
    expect(contarPorSituacao([{ situacao: 'bloqueado' }])).toEqual({ pendente: 0, ativo: 0, bloqueado: 1 })
  })

  it('conta cada situação', () => {
    const usuarios = [{ situacao: 'ativo' as const }, { situacao: 'pendente' as const }, { situacao: 'ativo' as const }]
    expect(contarPorSituacao(usuarios)).toEqual({ pendente: 1, ativo: 2, bloqueado: 0 })
  })
})

describe('filtro da tela de usuários', () => {
  const comPendentes = { pendente: 2, ativo: 5, bloqueado: 0 }
  const semPendentes = { pendente: 0, ativo: 5, bloqueado: 1 }

  it('respeita o filtro da URL quando válido', () => {
    expect(filtroDeSituacao('bloqueado', comPendentes)).toBe('bloqueado')
    expect(filtroDeSituacao('ativo', comPendentes)).toBe('ativo')
    expect(filtroDeSituacao('pendente', semPendentes)).toBe('pendente')
  })

  it('sem filtro ou inválido: pendente se houver alguém aguardando, senão ativo', () => {
    for (const valor of [undefined, '', 'PENDENTE', 'todos', '<script>']) {
      expect(filtroDeSituacao(valor, comPendentes)).toBe('pendente')
      expect(filtroDeSituacao(valor, semPendentes)).toBe('ativo')
    }
  })
})
