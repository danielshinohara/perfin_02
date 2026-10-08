import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { tipoDeLink } from '@/lib/auth/validacao'
import { MarcaPerfin } from '@/components/autenticacao/MarcaPerfin'
import estilos from '../../autenticacao.module.css'

export const metadata: Metadata = { title: 'Confirmar', description: 'Confirme o link recebido por e-mail.' }

type Parametros = Promise<{ token_hash?: string; type?: string }>

/** Etapa com botão antes de validar o link do e-mail (o token só é consumido no clique). */
export default async function PaginaConfirmar({ searchParams }: { searchParams: Parametros }) {
  const { token_hash: tokenHash, type } = await searchParams
  const tipo = tipoDeLink(type ?? null)
  if (!tokenHash || !tipo) redirect('/login?erro=link')
  const recuperacao = tipo === 'recovery'
  return (
    <main className={estilos.pagina}>
      <div className={`cartao ${estilos.caixa}`}>
        <MarcaPerfin />
        <div>
          <h1>{recuperacao ? 'Criar uma nova senha' : 'Confirmar seu e-mail'}</h1>
          <p>{recuperacao ? 'Continue para definir a nova senha da sua conta.' : 'Clique no botão para confirmar seu cadastro no Portal Perfin.'}</p>
        </div>
        <form action="/auth/confirmar" method="post" className={estilos.formulario}>
          <input type="hidden" name="token_hash" value={tokenHash} />
          <input type="hidden" name="type" value={tipo} />
          <button type="submit" className="botao">
            {recuperacao ? 'Continuar' : 'Confirmar e-mail'}
          </button>
        </form>
      </div>
    </main>
  )
}
