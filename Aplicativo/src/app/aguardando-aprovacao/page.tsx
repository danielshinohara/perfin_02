import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { obterSessao } from '@/lib/auth/sessao'
import { destinoPorSituacao } from '@/lib/auth/validacao'
import { MarcaPerfin } from '@/components/autenticacao/MarcaPerfin'
import estilos from '../autenticacao.module.css'

export const metadata: Metadata = { title: 'Aguardando aprovação', description: 'Seu cadastro está em análise.' }

export default async function PaginaAguardandoAprovacao() {
  const sessao = await obterSessao()
  if (!sessao) redirect('/login')
  if (sessao.situacao !== 'pendente') redirect(destinoPorSituacao(sessao.situacao))
  return (
    <main className={estilos.pagina}>
      <div className={`cartao ${estilos.caixa}`}>
        <MarcaPerfin />
        <h1>Cadastro recebido</h1>
        <p>
          Olá{sessao.nome ? `, ${sessao.nome}` : ''}. Recebemos o cadastro de <strong>{sessao.email}</strong>. Um administrador da
          Perfin vai liberar seu acesso; depois disso, é só entrar de novo.
        </p>
        <form action="/auth/sair" method="post">
          <button type="submit" className="botao botao-secundario">
            Sair
          </button>
        </form>
      </div>
    </main>
  )
}
