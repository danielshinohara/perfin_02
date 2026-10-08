import type { Metadata } from 'next'
import Link from 'next/link'
import { exigirUsuario } from '@/lib/auth/sessao'
import { contarPendentes } from '@/lib/servicos/admin'
import { BotaoInstalar } from '@/components/pwa/BotaoInstalar'
import { itensAdmin, ITENS_FERRAMENTAS, ITENS_PAINEIS, type ItemNavegacao } from '@/components/portal/itens-navegacao'

export const metadata: Metadata = { title: 'Menu', description: 'Todos os painéis e ferramentas do Portal Perfin.' }

function Lista({ titulo, itens }: { titulo: string; itens: ItemNavegacao[] }) {
  return (
    <section className="cartao" aria-label={titulo}>
      <h2 className="rotulo">{titulo}</h2>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {itens.map((item) => (
          <li key={item.href}>
            <Link href={item.href} style={{ display: 'flex', minHeight: 48, alignItems: 'center', fontWeight: 700 }}>
              {item.rotulo}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default async function PaginaMenu() {
  const sessao = await exigirUsuario()
  const pendentes = sessao.papel === 'admin' ? await contarPendentes() : 0
  return (
    <>
      <h1>Menu</h1>
      <Lista titulo="Painéis" itens={ITENS_PAINEIS} />
      <Lista titulo="Ferramentas" itens={ITENS_FERRAMENTAS} />
      {sessao.papel === 'admin' && <Lista titulo="Administração" itens={itensAdmin(pendentes)} />}
      <BotaoInstalar />
      <form action="/auth/sair" method="post">
        <button type="submit" className="botao botao-secundario">
          Sair ({sessao.email})
        </button>
      </form>
    </>
  )
}
