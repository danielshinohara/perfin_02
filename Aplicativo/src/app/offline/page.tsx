import type { Metadata } from 'next'
import Link from 'next/link'
import { MarcaPerfin } from '@/components/autenticacao/MarcaPerfin'
import estilos from '../autenticacao.module.css'

export const metadata: Metadata = { title: 'Sem conexão', description: 'O Portal Perfin está sem conexão.' }

export default function PaginaOffline() {
  return (
    <main className={estilos.pagina}>
      <div className={`cartao ${estilos.caixa}`}>
        <MarcaPerfin />
        <h1>Sem conexão</h1>
        <p>
          Esta página ainda não foi aberta neste aparelho, por isso não está disponível offline. As páginas que você já
          visitou continuam acessíveis com os últimos dados.
        </p>
        <Link className="botao" href="/">
          Tentar de novo
        </Link>
      </div>
    </main>
  )
}
