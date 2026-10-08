import { z } from 'zod'

export const SENHA_MINIMA = 10
const SENHA_MAXIMA_BYTES = 72 // limite do bcrypt usado pelo Supabase Auth (acentos ocupam 2 bytes)

export const MENSAGEM_SENHA_FRACA = 'Senha fraca. Use letras, números e símbolos e evite senhas comuns.'

/** Resultado das ações dos formulários de login, cadastro e senha. */
export interface EstadoFormulario {
  erro: string | null
  sucesso: string | null
}

const email = z.string().trim().toLowerCase().pipe(z.email().max(254))
const novaSenha = z
  .string()
  .min(SENHA_MINIMA, `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`)
  .refine((senha) => new TextEncoder().encode(senha).length <= SENHA_MAXIMA_BYTES, 'Senha longa demais. Use até 72 caracteres sem acentos.')

export const esquemaEntrar = z.object({
  email,
  senha: z.string().min(1).max(200),
})

export const esquemaCadastro = z
  .object({
    nome: z.string().trim().min(2, 'Informe seu nome.').max(120, 'Nome muito longo.'),
    email,
    senha: novaSenha,
    confirmacao: z.string(),
  })
  .refine((dados) => dados.senha === dados.confirmacao, {
    message: 'As senhas não conferem.',
    path: ['confirmacao'],
  })

export const esquemaRecuperar = z.object({ email })

export const esquemaNovaSenha = z
  .object({ senha: novaSenha, confirmacao: z.string() })
  .refine((dados) => dados.senha === dados.confirmacao, {
    message: 'As senhas não conferem.',
    path: ['confirmacao'],
  })

/** Lê os campos do FormData como texto (ausente = ''). */
export function camposDoFormulario<const T extends readonly string[]>(
  formulario: FormData,
  nomes: T,
): Record<T[number], string> {
  return Object.fromEntries(
    nomes.map((nome) => {
      const valor = formulario.get(nome)
      return [nome, typeof valor === 'string' ? valor : '']
    }),
  ) as Record<T[number], string>
}

// Campos cujas mensagens de validação foram escritas em pt-BR acima.
const CAMPOS_COM_MENSAGEM = new Set<PropertyKey>(['nome', 'senha', 'confirmacao'])

/** Primeira mensagem de erro de validação para mostrar ao usuário (e-mail inválido usa o padrão). */
export function primeiraMensagem(erro: z.ZodError, padrao: string): string {
  const problema = erro.issues[0]
  return problema && CAMPOS_COM_MENSAGEM.has(problema.path[0] ?? '') ? problema.message : padrao
}

export const SITUACOES = ['pendente', 'ativo', 'bloqueado'] as const
export type Situacao = (typeof SITUACOES)[number]

/** Situação do perfil vinda do banco; valor ausente ou desconhecido nega o acesso. */
export function lerSituacao(valor: unknown): Situacao {
  return SITUACOES.find((s) => s === valor) ?? 'bloqueado'
}

/** Destino de quem tem sessão, conforme a situação do perfil. */
export function destinoPorSituacao(situacao: Situacao): '/' | '/aguardando-aprovacao' | '/acesso-negado' {
  if (situacao === 'ativo') return '/'
  return situacao === 'pendente' ? '/aguardando-aprovacao' : '/acesso-negado'
}

const TIPOS_LINK = ['signup', 'email', 'recovery', 'invite', 'email_change'] as const
export type TipoLinkEmail = (typeof TIPOS_LINK)[number]

/** Valida o `type` dos links enviados por e-mail pelo Supabase. */
export function tipoDeLink(valor: string | null): TipoLinkEmail | null {
  return TIPOS_LINK.find((tipo) => tipo === valor) ?? null
}
