import { describe, expect, it } from 'vitest'
import {
  camposDoFormulario,
  destinoPorSituacao,
  esquemaCadastro,
  esquemaEntrar,
  esquemaNovaSenha,
  esquemaRecuperar,
  lerSituacao,
  primeiraMensagem,
  SENHA_MINIMA,
  tipoDeLink,
} from './validacao'

const SENHA_OK = 'senha-forte-123'
const PADRAO = 'Informe um e-mail válido.'

function cadastro(parcial: Partial<Record<'nome' | 'email' | 'senha' | 'confirmacao', string>> = {}) {
  return { nome: 'Ana', email: 'ana@exemplo.com', senha: SENHA_OK, confirmacao: SENHA_OK, ...parcial }
}

describe('esquemaEntrar', () => {
  it('normaliza e-mail com espaços e maiúsculas', () => {
    const r = esquemaEntrar.safeParse({ email: '  Ana@Exemplo.COM ', senha: 'x' })
    expect(r.success && r.data.email).toBe('ana@exemplo.com')
  })

  it('não exige tamanho mínimo da senha no login, mas exige algo e limita o tamanho', () => {
    expect(esquemaEntrar.safeParse({ email: 'a@b.com', senha: '1' }).success).toBe(true)
    expect(esquemaEntrar.safeParse({ email: 'a@b.com', senha: '' }).success).toBe(false)
    expect(esquemaEntrar.safeParse({ email: 'a@b.com', senha: 'x'.repeat(201) }).success).toBe(false)
  })

  it('rejeita e-mail vazio, só espaços, sem domínio e muito longo', () => {
    for (const email of ['', '   ', 'ana', 'ana@', `${'a'.repeat(250)}@b.com`]) {
      expect(esquemaEntrar.safeParse({ email, senha: 'x' }).success).toBe(false)
    }
  })

  it('rejeita tipos inesperados', () => {
    expect(esquemaEntrar.safeParse({ email: null, senha: 'x' }).success).toBe(false)
    expect(esquemaEntrar.safeParse({}).success).toBe(false)
  })
})

describe('esquemaCadastro', () => {
  it('aceita dados válidos e normaliza nome e e-mail', () => {
    const r = esquemaCadastro.safeParse(cadastro({ nome: '  José Conceição ', email: ' JOSE@Exemplo.com.br ' }))
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.nome).toBe('José Conceição')
      expect(r.data.email).toBe('jose@exemplo.com.br')
    }
  })

  it('nome curto (inclusive uma letra cercada de espaços) é rejeitado', () => {
    for (const nome of ['', 'A', '  A  ', '   ']) {
      const r = esquemaCadastro.safeParse(cadastro({ nome }))
      expect(r.success).toBe(false)
      if (!r.success) expect(primeiraMensagem(r.error, PADRAO)).toBe('Informe seu nome.')
    }
  })

  it('nome com 120 caracteres passa; 121 não', () => {
    expect(esquemaCadastro.safeParse(cadastro({ nome: 'á'.repeat(120) })).success).toBe(true)
    const r = esquemaCadastro.safeParse(cadastro({ nome: 'á'.repeat(121) }))
    expect(r.success).toBe(false)
    if (!r.success) expect(primeiraMensagem(r.error, PADRAO)).toBe('Nome muito longo.')
  })

  it('senha com menos de 10 caracteres é rejeitada com mensagem pt-BR', () => {
    const curta = 'x'.repeat(SENHA_MINIMA - 1)
    const r = esquemaCadastro.safeParse(cadastro({ senha: curta, confirmacao: curta }))
    expect(r.success).toBe(false)
    if (!r.success) expect(primeiraMensagem(r.error, PADRAO)).toBe('A senha precisa ter pelo menos 10 caracteres.')
  })

  it('limites exatos de senha: 10 e 72 passam; 73 não', () => {
    for (const tamanho of [10, 72]) {
      const s = 'x'.repeat(tamanho)
      expect(esquemaCadastro.safeParse(cadastro({ senha: s, confirmacao: s })).success).toBe(true)
    }
    const longa = 'x'.repeat(73)
    const r = esquemaCadastro.safeParse(cadastro({ senha: longa, confirmacao: longa }))
    expect(r.success).toBe(false)
    if (!r.success) expect(primeiraMensagem(r.error, PADRAO)).toBe('Senha longa demais. Use até 72 caracteres sem acentos.')
  })

  it('o limite de 72 é em bytes (bcrypt): acentos contam 2', () => {
    const comAcentos = 'é'.repeat(37) // 74 bytes
    expect(esquemaCadastro.safeParse(cadastro({ senha: comAcentos, confirmacao: comAcentos })).success).toBe(false)
    const noLimite = 'é'.repeat(36) // 72 bytes
    expect(esquemaCadastro.safeParse(cadastro({ senha: noLimite, confirmacao: noLimite })).success).toBe(true)
  })

  it('confirmação diferente aponta para o campo confirmacao', () => {
    const r = esquemaCadastro.safeParse(cadastro({ confirmacao: SENHA_OK + ' ' }))
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.issues[0]?.path).toEqual(['confirmacao'])
      expect(primeiraMensagem(r.error, PADRAO)).toBe('As senhas não conferem.')
    }
  })

  it('senha não é aparada (espaços contam)', () => {
    const r = esquemaCadastro.safeParse(cadastro({ senha: ' senha-forte-123 ', confirmacao: ' senha-forte-123 ' }))
    expect(r.success && r.data.senha).toBe(' senha-forte-123 ')
  })

  it('e-mail inválido usa a mensagem padrão', () => {
    const r = esquemaCadastro.safeParse(cadastro({ email: 'nao-e-email' }))
    expect(r.success).toBe(false)
    if (!r.success) expect(primeiraMensagem(r.error, PADRAO)).toBe(PADRAO)
  })
})

describe('esquemaRecuperar', () => {
  it('normaliza e valida o e-mail', () => {
    const r = esquemaRecuperar.safeParse({ email: ' X@Y.COM ' })
    expect(r.success && r.data.email).toBe('x@y.com')
    expect(esquemaRecuperar.safeParse({ email: '' }).success).toBe(false)
    expect(esquemaRecuperar.safeParse({ email: 'x@' }).success).toBe(false)
  })
})

describe('esquemaNovaSenha', () => {
  it('aceita senha válida igual à confirmação', () => {
    expect(esquemaNovaSenha.safeParse({ senha: SENHA_OK, confirmacao: SENHA_OK }).success).toBe(true)
  })

  it('rejeita curta, longa e confirmação diferente', () => {
    expect(esquemaNovaSenha.safeParse({ senha: '123456789', confirmacao: '123456789' }).success).toBe(false)
    const longa = 'y'.repeat(73)
    expect(esquemaNovaSenha.safeParse({ senha: longa, confirmacao: longa }).success).toBe(false)
    const r = esquemaNovaSenha.safeParse({ senha: SENHA_OK, confirmacao: 'outra-senha-123' })
    expect(r.success).toBe(false)
    if (!r.success) expect(primeiraMensagem(r.error, PADRAO)).toBe('As senhas não conferem.')
  })

  it('acentos contam como caracteres', () => {
    const s = 'ção'.repeat(4)
    expect(esquemaNovaSenha.safeParse({ senha: s, confirmacao: s }).success).toBe(true)
  })
})

describe('camposDoFormulario', () => {
  it('lê os campos como texto e usa "" para ausentes', () => {
    const f = new FormData()
    f.set('email', 'a@b.com')
    expect(camposDoFormulario(f, ['email', 'senha'])).toEqual({ email: 'a@b.com', senha: '' })
  })

  it('arquivo enviado no lugar de texto vira ""', () => {
    const f = new FormData()
    f.set('senha', new File(['conteudo'], 'senha.txt'))
    expect(camposDoFormulario(f, ['senha'])).toEqual({ senha: '' })
  })

  it('campo repetido usa o primeiro valor e ignora campos extras', () => {
    const f = new FormData()
    f.append('email', 'primeiro@b.com')
    f.append('email', 'segundo@b.com')
    f.append('papel', 'admin')
    expect(camposDoFormulario(f, ['email'])).toEqual({ email: 'primeiro@b.com' })
  })

  it('lista vazia de nomes devolve objeto vazio', () => {
    expect(camposDoFormulario(new FormData(), [])).toEqual({})
  })
})

describe('primeiraMensagem', () => {
  it('com vários problemas, mostra o do primeiro campo (nome) em pt-BR', () => {
    const r = esquemaCadastro.safeParse({ nome: 'A', email: 'ruim', senha: '1', confirmacao: '2' })
    expect(r.success).toBe(false)
    if (!r.success) expect(primeiraMensagem(r.error, PADRAO)).toBe('Informe seu nome.')
  })

  it('usa o padrão para campos sem mensagem própria', () => {
    const r = esquemaEntrar.safeParse({ email: 'ruim', senha: 'x' })
    expect(r.success).toBe(false)
    if (!r.success) expect(primeiraMensagem(r.error, PADRAO)).toBe(PADRAO)
  })
})

describe('lerSituacao', () => {
  it('aceita as situações conhecidas', () => {
    expect(lerSituacao('pendente')).toBe('pendente')
    expect(lerSituacao('ativo')).toBe('ativo')
    expect(lerSituacao('bloqueado')).toBe('bloqueado')
  })

  it('valores ausentes ou desconhecidos negam o acesso', () => {
    for (const valor of [null, undefined, '', 'ATIVO', ' ativo', 'admin', 1, true, {}, ['ativo']]) {
      expect(lerSituacao(valor)).toBe('bloqueado')
    }
  })
})

describe('destinoPorSituacao', () => {
  it('leva cada situação à tela certa', () => {
    expect(destinoPorSituacao('ativo')).toBe('/')
    expect(destinoPorSituacao('pendente')).toBe('/aguardando-aprovacao')
    expect(destinoPorSituacao('bloqueado')).toBe('/acesso-negado')
  })
})

describe('tipoDeLink', () => {
  it('aceita os tipos do Supabase', () => {
    for (const tipo of ['signup', 'email', 'recovery', 'invite', 'email_change'] as const) {
      expect(tipoDeLink(tipo)).toBe(tipo)
    }
  })

  it('rejeita nulo, vazio, maiúsculas e tipos não suportados', () => {
    for (const tipo of [null, '', 'RECOVERY', 'magiclink', 'sms', 'recovery ']) {
      expect(tipoDeLink(tipo)).toBeNull()
    }
  })
})
