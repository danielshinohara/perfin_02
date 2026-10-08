import { describe, expect, it } from 'vitest'
import { itensAdmin } from './itens-navegacao'

function rotuloUsuarios(pendentes: number) {
  return itensAdmin(pendentes).find((item) => item.href === '/admin/usuarios')?.rotulo
}

describe('itens de administração', () => {
  it('sem pendentes (ou valor negativo) mostra o rótulo simples', () => {
    expect(rotuloUsuarios(0)).toBe('Usuários')
    expect(rotuloUsuarios(-3)).toBe('Usuários')
  })

  it('singular e plural', () => {
    expect(rotuloUsuarios(1)).toBe('Usuários (1 pendente)')
    expect(rotuloUsuarios(2)).toBe('Usuários (2 pendentes)')
  })

  it('mantém os demais itens e a ordem', () => {
    expect(itensAdmin(2).map((i) => i.href)).toEqual(['/admin/usuarios', '/admin/alertas'])
    expect(itensAdmin(2).find((i) => i.href === '/admin/alertas')?.rotulo).toBe('Alertas')
  })

  it('não muta a lista original entre chamadas', () => {
    const comPendentes = itensAdmin(5)
    expect(rotuloUsuarios(0)).toBe('Usuários')
    expect(itensAdmin(0)).not.toBe(comPendentes)
    expect(rotuloUsuarios(3)).toBe('Usuários (3 pendentes)')
  })
})
