import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { obterSessao } from '@/lib/auth/sessao'
import { FormularioCadastro } from '@/components/autenticacao/FormularioCadastro'
import { FormularioEntrar } from '@/components/autenticacao/FormularioEntrar'
import { MarcaPerfin } from '@/components/autenticacao/MarcaPerfin'
import estilos from '../autenticacao.module.css'

export const metadata: Metadata = { title: 'Entrar', description: 'Entre ou crie sua conta no Portal Perfin.' }

const MENSAGENS_ERRO: Record<string, string> = {
  google: 'Não foi possível entrar com o Google. Tente novamente.',
  cancelado: 'O login com o Google foi cancelado.',
  sessao: 'Sua sessão expirou. Entre novamente.',
  link: 'O link é inválido ou expirou. Peça um novo.',
  'link-outro-navegador':
    'Não foi possível concluir pelo link neste navegador. Se você estava confirmando o cadastro, tente entrar com seu e-mail e senha; para nova senha, peça um novo link.',
}

type Modo = 'entrar' | 'cadastro'

interface Parametros {
  erro?: string
  modo?: string
}

export default async function PaginaLogin({ searchParams }: { searchParams: Promise<Parametros> }) {
  const sessao = await obterSessao()
  if (sessao?.situacao === 'ativo') redirect('/')
  const { erro, modo: modoParametro } = await searchParams
  const modo: Modo = modoParametro === 'cadastro' ? 'cadastro' : 'entrar'
  const mensagem = erro ? (Object.hasOwn(MENSAGENS_ERRO, erro) ? MENSAGENS_ERRO[erro] : MENSAGENS_ERRO.google) : null

  return (
    <main className={estilos.pagina}>
      <div className={`cartao ${estilos.caixa}`}>
        <MarcaPerfin />
        <nav className={estilos.abas} aria-label="Entrar ou criar conta">
          <Link href="/login" className={estilos.aba} aria-current={modo === 'entrar' ? 'page' : undefined} replace>
            Entrar
          </Link>
          <Link href="/login?modo=cadastro" className={estilos.aba} aria-current={modo === 'cadastro' ? 'page' : undefined} replace>
            Criar conta
          </Link>
        </nav>
        <div>
          <h1>{modo === 'entrar' ? 'Entrar no portal' : 'Criar sua conta'}</h1>
          <p>Central de análise econômica da Perfin.</p>
        </div>
        {mensagem && (
          <p className="aviso aviso-alerta" role="alert">
            {mensagem}
          </p>
        )}
        <form action="/auth/google" method="post" className={estilos.formulario}>
          <button type="submit" className="botao botao-secundario">
            <span className={estilos.iconeGoogle} aria-hidden="true">
              G
            </span>
            Continuar com Google
          </button>
        </form>
        <div className={estilos.separador}>ou com e-mail</div>
        {modo === 'entrar' ? <FormularioEntrar /> : <FormularioCadastro />}
        <p className={estilos.legal}>
          Ao continuar com Google, o portal pede acesso para criar planilhas no seu Drive, ler suas próximas reuniões e criar
          rascunhos no Gmail. O portal nunca envia e-mails por você.
        </p>
      </div>
    </main>
  )
}
