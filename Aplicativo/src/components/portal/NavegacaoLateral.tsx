import Link from 'next/link'
import type { Sessao } from '@/lib/auth/sessao'
import estilos from '@/app/portal.module.css'
import { BotaoInstalar } from '@/components/pwa/BotaoInstalar'
import { ITENS_ADMIN, ITENS_FERRAMENTAS, ITENS_PAINEIS, type ItemNavegacao } from './itens-navegacao'
import { LinkNavegacao } from './LinkNavegacao'

function Grupo({ titulo, itens }: { titulo: string; itens: ItemNavegacao[] }) {
  return (
    <>
      <span className={`rotulo ${estilos.grupoNavegacao}`}>{titulo}</span>
      {itens.map((item) => (
        <LinkNavegacao key={item.href} {...item} classe={estilos.link} classeAtiva={estilos.linkAtivo} />
      ))}
    </>
  )
}

export function NavegacaoLateral({ sessao }: { sessao: Sessao }) {
  return (
    <aside className={estilos.lateral}>
      <Link href="/" className={estilos.marca}>
        <span className={estilos.marcaSimbolo} aria-hidden="true">
          P
        </span>
        Portal Perfin
      </Link>
      <nav className={estilos.navegacao} aria-label="Navegação principal">
        <Grupo titulo="Painéis" itens={ITENS_PAINEIS} />
        <Grupo titulo="Ferramentas" itens={ITENS_FERRAMENTAS} />
        {sessao.papel === 'admin' && <Grupo titulo="Administração" itens={ITENS_ADMIN} />}
      </nav>
      <div className={estilos.rodapeLateral}>
        <BotaoInstalar />
        <span>
          {sessao.nome ?? sessao.email}
          <br />
          <span className="rotulo">{sessao.papel === 'admin' ? 'Administrador' : 'Usuário'}</span>
        </span>
        <form action="/auth/sair" method="post">
          <button type="submit" className="botao botao-secundario" style={{ width: '100%' }}>
            Sair
          </button>
        </form>
      </div>
    </aside>
  )
}
