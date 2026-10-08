import type { Metadata } from 'next'
import Link from 'next/link'
import { FormularioRecuperar } from '@/components/autenticacao/FormularioRecuperar'
import { MarcaPerfin } from '@/components/autenticacao/MarcaPerfin'
import estilos from '../../autenticacao.module.css'

export const metadata: Metadata = { title: 'Esqueci minha senha', description: 'Receba um link para criar uma nova senha.' }

export default function PaginaRecuperarSenha() {
  return (
    <main className={estilos.pagina}>
      <div className={`cartao ${estilos.caixa}`}>
        <MarcaPerfin />
        <div>
          <h1>Esqueci minha senha</h1>
          <p>Informe o e-mail da sua conta. Vamos enviar um link para você criar uma nova senha.</p>
        </div>
        <FormularioRecuperar />
        <Link href="/login" className={estilos.linkSecundario}>
          Voltar para o login
        </Link>
      </div>
    </main>
  )
}
