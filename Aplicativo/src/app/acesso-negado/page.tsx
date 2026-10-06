import type { Metadata } from 'next'
import { MarcaPerfin } from '@/components/autenticacao/MarcaPerfin'
import estilos from '../autenticacao.module.css'

export const metadata: Metadata = { title: 'Acesso não autorizado', description: 'Seu acesso ao portal não está liberado.' }

export default function PaginaAcessoNegado() {
  return (
    <main className={estilos.pagina}>
      <div className={`cartao ${estilos.caixa}`}>
        <MarcaPerfin />
        <h1>Acesso não autorizado</h1>
        <p>Sua conta não tem permissão para acessar o Portal Perfin. Se você acredita que isso é um engano, fale com o administrador.</p>
        <form action="/auth/sair" method="post">
          <button type="submit" className="botao botao-secundario">
            Sair e entrar com outra conta
          </button>
        </form>
      </div>
    </main>
  )
}
