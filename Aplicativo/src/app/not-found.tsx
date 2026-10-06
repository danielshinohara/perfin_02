import Link from 'next/link'
import { MarcaPerfin } from '@/components/autenticacao/MarcaPerfin'
import estilos from './autenticacao.module.css'

export default function NaoEncontrado() {
  return (
    <main className={estilos.pagina}>
      <div className={`cartao ${estilos.caixa}`}>
        <MarcaPerfin />
        <h1>Página não encontrada</h1>
        <p>O endereço acessado não existe no Portal Perfin.</p>
        <Link className="botao" href="/">
          Ir para a visão geral
        </Link>
      </div>
    </main>
  )
}
