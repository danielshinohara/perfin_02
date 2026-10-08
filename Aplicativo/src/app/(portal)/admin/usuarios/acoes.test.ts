import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  exigirAdmin: vi.fn(),
  definirSituacao: vi.fn(),
  revalidatePath: vi.fn(),
  cliente: { marcador: 'cliente-supabase' },
}))

vi.mock('@/lib/auth/sessao', () => ({ exigirAdmin: mocks.exigirAdmin }))
vi.mock('@/lib/servicos/admin', () => ({ definirSituacao: mocks.definirSituacao }))
vi.mock('@/lib/supabase/servidor', () => ({ criarClienteServidor: async () => mocks.cliente }))
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }))

import { alterarSituacao } from './acoes'

const ADMIN_ID = '11111111-1111-4111-8111-111111111111'
const USUARIO_ID = '22222222-2222-4222-8222-222222222222'

function formulario(campos: Record<string, string>): FormData {
  const f = new FormData()
  for (const [nome, valor] of Object.entries(campos)) f.set(nome, valor)
  return f
}

beforeEach(() => {
  mocks.exigirAdmin.mockReset().mockResolvedValue({ userId: ADMIN_ID, papel: 'admin' })
  mocks.definirSituacao.mockReset().mockResolvedValue(undefined)
  mocks.revalidatePath.mockReset()
})

describe('alterar situação do usuário', () => {
  it.each(['ativo', 'bloqueado'] as const)('grava "%s" e revalida as telas', async (situacao) => {
    await alterarSituacao(formulario({ userId: USUARIO_ID, situacao }))
    expect(mocks.definirSituacao).toHaveBeenCalledWith(mocks.cliente, USUARIO_ID, situacao)
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/admin/usuarios')
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/', 'layout')
  })

  it('não permite voltar alguém para pendente nem situações desconhecidas', async () => {
    for (const situacao of ['pendente', 'admin', '', 'ATIVO']) {
      await expect(alterarSituacao(formulario({ userId: USUARIO_ID, situacao }))).rejects.toThrow('Dados inválidos')
    }
    expect(mocks.definirSituacao).not.toHaveBeenCalled()
  })

  it('rejeita userId que não é UUID ou ausente', async () => {
    for (const userId of ['', '123', 'nao-uuid', `${USUARIO_ID}'; drop table perfis;--`]) {
      await expect(alterarSituacao(formulario({ userId, situacao: 'ativo' }))).rejects.toThrow('Dados inválidos')
    }
    await expect(alterarSituacao(formulario({ situacao: 'ativo' }))).rejects.toThrow('Dados inválidos')
    expect(mocks.definirSituacao).not.toHaveBeenCalled()
  })

  it('admin não pode alterar o próprio acesso', async () => {
    await expect(alterarSituacao(formulario({ userId: ADMIN_ID, situacao: 'bloqueado' }))).rejects.toThrow(
      'Você não pode alterar o próprio acesso',
    )
    expect(mocks.definirSituacao).not.toHaveBeenCalled()
  })

  it('sem sessão de admin não valida nem grava nada', async () => {
    mocks.exigirAdmin.mockRejectedValue(new Error('REDIRECT:/acesso-negado'))
    await expect(alterarSituacao(formulario({ userId: USUARIO_ID, situacao: 'ativo' }))).rejects.toThrow(
      'REDIRECT:/acesso-negado',
    )
    expect(mocks.definirSituacao).not.toHaveBeenCalled()
  })

  it('erro ao gravar é propagado e não revalida', async () => {
    mocks.definirSituacao.mockRejectedValue(new Error('Não foi possível alterar o acesso do usuário'))
    await expect(alterarSituacao(formulario({ userId: USUARIO_ID, situacao: 'ativo' }))).rejects.toThrow(
      'Não foi possível alterar o acesso do usuário',
    )
    expect(mocks.revalidatePath).not.toHaveBeenCalled()
  })
})
