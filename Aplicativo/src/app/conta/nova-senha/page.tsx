import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { emailDaSessaoDeRecuperacao } from '@/lib/auth/sessao'
import { FormularioNovaSenha } from '@/components/autenticacao/FormularioNovaSenha'
import { MarcaPerfin } from '@/components/autenticacao/MarcaPerfin'
import estilos from '../../autenticacao.module.css'

export const metadata: Metadata = { title: 'Nova senha', description: 'Defina uma nova senha para o Portal Perfin.' }

export default async function PaginaNovaSenha() {
  const email = await emailDaSessaoDeRecuperacao()
  if (email === null) redirect('/login?erro=link')
  return (
    <main className={estilos.pagina}>
      <div className={`cartao ${estilos.caixa}`}>
        <MarcaPerfin />
        <div>
          <h1>Nova senha</h1>
          <p>Conta {email}</p>
        </div>
        <FormularioNovaSenha />
      </div>
    </main>
  )
}
