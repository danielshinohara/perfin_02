import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { obterSessao } from '@/lib/auth/sessao'
import { FormularioAdmin } from '@/components/autenticacao/FormularioAdmin'
import { MarcaPerfin } from '@/components/autenticacao/MarcaPerfin'
import estilos from '../autenticacao.module.css'

export const metadata: Metadata = { title: 'Entrar', description: 'Acesso ao Portal Perfin.' }

const MENSAGENS_ERRO: Record<string, string> = {
  google: 'Não foi possível entrar com o Google. Tente novamente.',
  cancelado: 'O login com o Google foi cancelado.',
  sessao: 'Sua sessão expirou. Entre novamente.',
}

export default async function PaginaLogin({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const sessao = await obterSessao()
  if (sessao && !sessao.bloqueado) redirect('/')
  const { erro } = await searchParams
  const mensagem = erro ? (MENSAGENS_ERRO[erro] ?? MENSAGENS_ERRO.google) : null

  return (
    <main className={estilos.pagina}>
      <div className={`cartao ${estilos.caixa}`}>
        <MarcaPerfin />
        <div>
          <h1>Entrar</h1>
          <p>Central de análise econômica da Perfin.</p>
        </div>
        {mensagem && (
          <p className="aviso aviso-alerta" role="alert">
            {mensagem}
          </p>
        )}
        <form action="/auth/google" method="post" className={estilos.formulario}>
          <button type="submit" className="botao">
            Entrar com Google
          </button>
        </form>
        <div className={estilos.separador}>ou</div>
        <details className={estilos.detalhes}>
          <summary>Acesso administrador</summary>
          <FormularioAdmin />
        </details>
        <p className={estilos.legal}>
          Ao entrar com Google, o portal pede acesso para criar planilhas no seu Drive, ler suas próximas reuniões e criar
          rascunhos no Gmail. O portal nunca envia e-mails por você.
        </p>
      </div>
    </main>
  )
}
