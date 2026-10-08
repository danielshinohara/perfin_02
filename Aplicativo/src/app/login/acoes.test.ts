import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  rpc: vi.fn(),
  cabecalhos: new Map<string, string>(),
}))

vi.mock('@/lib/supabase/servidor', () => ({
  criarClienteServidor: async () => ({
    auth: {
      signInWithPassword: mocks.signInWithPassword,
      signUp: mocks.signUp,
      resetPasswordForEmail: mocks.resetPasswordForEmail,
    },
    rpc: mocks.rpc,
  }),
}))

vi.mock('next/headers', () => ({
  headers: async () => ({ get: (nome: string) => mocks.cabecalhos.get(nome.toLowerCase()) ?? null }),
}))

vi.mock('next/navigation', () => ({
  redirect: (destino: string) => {
    throw new Error(`REDIRECT:${destino}`)
  },
}))

vi.mock('@/lib/env', () => ({
  urlDoSite: (caminho = '') => `https://app.exemplo${caminho}`,
}))

type Acoes = typeof import('./acoes')
let acoes: Acoes

const ESTADO = { erro: null, sucesso: null }
const SENHA = 'senha-forte-123'
const ERRO_LOGIN = 'E-mail ou senha inválidos.'
const ERRO_LIMITE = 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
const CADASTRO_ENVIADO =
  'Enviamos um link de confirmação para o seu e-mail. Depois de confirmar, um administrador vai liberar seu acesso.'
const RECUPERACAO_ENVIADA = 'Se houver uma conta com esse e-mail, você vai receber um link para criar uma nova senha.'

function formulario(campos: Record<string, string>): FormData {
  const f = new FormData()
  for (const [nome, valor] of Object.entries(campos)) f.set(nome, valor)
  return f
}

function cadastro(parcial: Record<string, string> = {}) {
  return formulario({ nome: 'Ana Souza', email: 'ana@exemplo.com', senha: SENHA, confirmacao: SENHA, ...parcial })
}

beforeEach(async () => {
  // Os limitadores são de módulo: recarregar o módulo zera os contadores entre os testes.
  vi.resetModules()
  mocks.signInWithPassword.mockReset().mockResolvedValue({ error: null })
  mocks.signUp.mockReset().mockResolvedValue({ error: null })
  mocks.resetPasswordForEmail.mockReset().mockResolvedValue({ error: null })
  mocks.rpc.mockReset().mockResolvedValue({ error: null })
  mocks.cabecalhos.clear()
  mocks.cabecalhos.set('x-forwarded-for', '203.0.113.7, 10.0.0.1')
  vi.spyOn(console, 'error').mockImplementation(() => {})
  acoes = await import('./acoes')
})

describe('entrar', () => {
  it('sucesso: normaliza o e-mail, registra o acesso e redireciona para /', async () => {
    await expect(acoes.entrar(ESTADO, formulario({ email: ' Ana@Exemplo.COM ', senha: SENHA }))).rejects.toThrow(
      'REDIRECT:/',
    )
    expect(mocks.signInWithPassword).toHaveBeenCalledWith({ email: 'ana@exemplo.com', password: SENHA })
    expect(mocks.rpc).toHaveBeenCalledWith('registrar_acesso')
  })

  it('falha ao registrar o acesso não impede o login', async () => {
    mocks.rpc.mockResolvedValue({ error: { code: 'XX000' } })
    await expect(acoes.entrar(ESTADO, formulario({ email: 'a@b.com', senha: SENHA }))).rejects.toThrow('REDIRECT:/')
  })

  it('credencial inválida devolve mensagem genérica', async () => {
    mocks.signInWithPassword.mockResolvedValue({ error: { code: 'invalid_credentials', status: 400 } })
    expect(await acoes.entrar(ESTADO, formulario({ email: 'a@b.com', senha: 'errada' }))).toEqual({
      erro: ERRO_LOGIN,
      sucesso: null,
    })
    expect(mocks.rpc).not.toHaveBeenCalled()
  })

  it('erro inesperado do Supabase também usa a mensagem genérica', async () => {
    mocks.signInWithPassword.mockResolvedValue({ error: { code: 'unexpected_failure', status: 500 } })
    expect((await acoes.entrar(ESTADO, formulario({ email: 'a@b.com', senha: 'x' }))).erro).toBe(ERRO_LOGIN)
  })

  it('e-mail não confirmado tem mensagem própria', async () => {
    mocks.signInWithPassword.mockResolvedValue({ error: { code: 'email_not_confirmed', status: 400 } })
    expect(await acoes.entrar(ESTADO, formulario({ email: 'a@b.com', senha: SENHA }))).toEqual({
      erro: 'Confirme seu e-mail pelo link que enviamos antes de entrar.',
      sucesso: null,
    })
  })

  it('dados inválidos ou ausentes não chamam o Supabase', async () => {
    const casos: Record<string, string>[] = [{}, { email: 'ruim', senha: 'x' }, { email: 'a@b.com', senha: '' }]
    for (const campos of casos) {
      expect((await acoes.entrar(ESTADO, formulario(campos))).erro).toBe(ERRO_LOGIN)
    }
    expect(mocks.signInWithPassword).not.toHaveBeenCalled()
  })

  it('bloqueia a 21ª tentativa do mesmo IP, mesmo com e-mails diferentes', async () => {
    mocks.signInWithPassword.mockResolvedValue({ error: { code: 'invalid_credentials' } })
    for (let i = 0; i < 20; i++) {
      expect((await acoes.entrar(ESTADO, formulario({ email: `u${i}@b.com`, senha: 'x' }))).erro).toBe(ERRO_LOGIN)
    }
    expect((await acoes.entrar(ESTADO, formulario({ email: 'u99@b.com', senha: 'x' }))).erro).toBe(ERRO_LIMITE)
    expect(mocks.signInWithPassword).toHaveBeenCalledTimes(20)
  })

  it('bloqueia a 6ª tentativa no mesmo e-mail, mesmo trocando de IP e de caixa', async () => {
    mocks.signInWithPassword.mockResolvedValue({ error: { code: 'invalid_credentials' } })
    for (let i = 0; i < 5; i++) {
      mocks.cabecalhos.set('x-forwarded-for', `198.51.100.${i}`)
      await acoes.entrar(ESTADO, formulario({ email: 'alvo@b.com', senha: 'x' }))
    }
    mocks.cabecalhos.set('x-forwarded-for', '198.51.100.99')
    expect((await acoes.entrar(ESTADO, formulario({ email: ' ALVO@b.com', senha: 'x' }))).erro).toBe(ERRO_LIMITE)
    expect(mocks.signInWithPassword).toHaveBeenCalledTimes(5)
  })

  it('usa só o primeiro IP do x-forwarded-for', async () => {
    mocks.signInWithPassword.mockResolvedValue({ error: { code: 'invalid_credentials' } })
    for (let i = 0; i < 20; i++) {
      mocks.cabecalhos.set('x-forwarded-for', `203.0.113.7, 10.0.0.${i}`)
      await acoes.entrar(ESTADO, formulario({ email: `v${i}@b.com`, senha: 'x' }))
    }
    mocks.cabecalhos.set('x-forwarded-for', '  203.0.113.7  ')
    expect((await acoes.entrar(ESTADO, formulario({ email: 'w@b.com', senha: 'x' }))).erro).toBe(ERRO_LIMITE)
  })

  it('sem x-forwarded-for todos compartilham o mesmo balde "desconhecido"', async () => {
    mocks.cabecalhos.clear()
    mocks.signInWithPassword.mockResolvedValue({ error: { code: 'invalid_credentials' } })
    for (let i = 0; i < 20; i++) await acoes.entrar(ESTADO, formulario({ email: `z${i}@b.com`, senha: 'x' }))
    expect((await acoes.entrar(ESTADO, formulario({ email: 'outro@b.com', senha: 'x' }))).erro).toBe(ERRO_LIMITE)
  })
})

describe('cadastrar', () => {
  it('sucesso: chama signUp com redirect de confirmação e nome nos metadados', async () => {
    expect(await acoes.cadastrar(ESTADO, cadastro({ nome: '  José  ', email: ' JOSE@Exemplo.com ' }))).toEqual({
      erro: null,
      sucesso: CADASTRO_ENVIADO,
    })
    expect(mocks.signUp).toHaveBeenCalledWith({
      email: 'jose@exemplo.com',
      password: SENHA,
      options: { emailRedirectTo: 'https://app.exemplo/auth/confirmar', data: { nome: 'José' } },
    })
  })

  it('e-mail já existente devolve exatamente a mesma resposta de sucesso', async () => {
    const sucesso = await acoes.cadastrar(ESTADO, cadastro())
    for (const code of ['user_already_exists', 'email_exists']) {
      mocks.signUp.mockResolvedValueOnce({ error: { code, status: 422 } })
      expect(await acoes.cadastrar(ESTADO, cadastro())).toEqual(sucesso)
    }
  })

  it('senha fraca recusada pelo Supabase', async () => {
    mocks.signUp.mockResolvedValue({ error: { code: 'weak_password', status: 422 } })
    expect(await acoes.cadastrar(ESTADO, cadastro())).toEqual({
      erro: 'Senha fraca. Use letras, números e símbolos e evite senhas comuns.',
      sucesso: null,
    })
  })

  it('limite de envio de e-mail do Supabase vira mensagem de limite', async () => {
    mocks.signUp.mockResolvedValueOnce({ error: { code: 'over_email_send_rate_limit', status: 429 } })
    expect((await acoes.cadastrar(ESTADO, cadastro())).erro).toBe(ERRO_LIMITE)
    mocks.signUp.mockResolvedValueOnce({ error: { status: 429 } })
    expect((await acoes.cadastrar(ESTADO, cadastro())).erro).toBe(ERRO_LIMITE)
  })

  it('erro desconhecido devolve mensagem genérica sem sucesso', async () => {
    mocks.signUp.mockResolvedValue({ error: { code: 'unexpected_failure', status: 500 } })
    expect(await acoes.cadastrar(ESTADO, cadastro())).toEqual({
      erro: 'Não foi possível concluir agora. Tente novamente em instantes.',
      sucesso: null,
    })
  })

  it('validação devolve a mensagem pt-BR do campo e não chama o Supabase', async () => {
    expect((await acoes.cadastrar(ESTADO, cadastro({ nome: 'A' }))).erro).toBe('Informe seu nome.')
    expect((await acoes.cadastrar(ESTADO, cadastro({ email: 'ruim' }))).erro).toBe('Informe um e-mail válido.')
    expect((await acoes.cadastrar(ESTADO, cadastro({ senha: 'curta', confirmacao: 'curta' }))).erro).toBe(
      'A senha precisa ter pelo menos 10 caracteres.',
    )
    expect((await acoes.cadastrar(ESTADO, cadastro({ confirmacao: 'outra-senha-1' }))).erro).toBe(
      'As senhas não conferem.',
    )
    expect((await acoes.cadastrar(ESTADO, formulario({}))).erro).toBe('Informe seu nome.')
    expect(mocks.signUp).not.toHaveBeenCalled()
  })

  it('bloqueia o 6º cadastro do mesmo IP', async () => {
    for (let i = 0; i < 5; i++) {
      expect((await acoes.cadastrar(ESTADO, cadastro({ email: `c${i}@b.com` }))).sucesso).toBe(CADASTRO_ENVIADO)
    }
    expect(await acoes.cadastrar(ESTADO, cadastro({ email: 'c9@b.com' }))).toEqual({ erro: ERRO_LIMITE, sucesso: null })
    expect(mocks.signUp).toHaveBeenCalledTimes(5)
  })
})

describe('recuperarSenha', () => {
  it('envia o link com redirect para recovery e devolve a mensagem neutra', async () => {
    expect(await acoes.recuperarSenha(ESTADO, formulario({ email: ' Ana@Exemplo.com ' }))).toEqual({
      erro: null,
      sucesso: RECUPERACAO_ENVIADA,
    })
    expect(mocks.resetPasswordForEmail).toHaveBeenCalledWith('ana@exemplo.com', {
      redirectTo: 'https://app.exemplo/auth/confirmar?type=recovery',
    })
  })

  it('erro do Supabase (conta inexistente, limite etc.) devolve a mesma mensagem', async () => {
    const neutra = await acoes.recuperarSenha(ESTADO, formulario({ email: 'a@b.com' }))
    mocks.resetPasswordForEmail.mockResolvedValueOnce({ error: { code: 'user_not_found', status: 400 } })
    expect(await acoes.recuperarSenha(ESTADO, formulario({ email: 'c@b.com' }))).toEqual(neutra)
    mocks.resetPasswordForEmail.mockResolvedValueOnce({ error: { status: 429 } })
    expect(await acoes.recuperarSenha(ESTADO, formulario({ email: 'd@b.com' }))).toEqual(neutra)
  })

  it('e-mail inválido não chama o Supabase', async () => {
    expect(await acoes.recuperarSenha(ESTADO, formulario({ email: 'ruim' }))).toEqual({
      erro: 'Informe um e-mail válido.',
      sucesso: null,
    })
    expect(await acoes.recuperarSenha(ESTADO, formulario({}))).toEqual({
      erro: 'Informe um e-mail válido.',
      sucesso: null,
    })
    expect(mocks.resetPasswordForEmail).not.toHaveBeenCalled()
  })

  it('bloqueia a 4ª tentativa para o mesmo e-mail, mesmo de IPs diferentes', async () => {
    for (let i = 0; i < 3; i++) {
      mocks.cabecalhos.set('x-forwarded-for', `192.0.2.${i}`)
      await acoes.recuperarSenha(ESTADO, formulario({ email: 'alvo@b.com' }))
    }
    mocks.cabecalhos.set('x-forwarded-for', '192.0.2.50')
    expect((await acoes.recuperarSenha(ESTADO, formulario({ email: 'alvo@b.com' }))).erro).toBe(ERRO_LIMITE)
    expect(mocks.resetPasswordForEmail).toHaveBeenCalledTimes(3)
  })

  it('bloqueia a 4ª tentativa do mesmo IP', async () => {
    for (let i = 0; i < 3; i++) await acoes.recuperarSenha(ESTADO, formulario({ email: `r${i}@b.com` }))
    expect((await acoes.recuperarSenha(ESTADO, formulario({ email: 'r9@b.com' }))).erro).toBe(ERRO_LIMITE)
  })
})
