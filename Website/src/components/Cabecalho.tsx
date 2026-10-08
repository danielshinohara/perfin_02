import { INSTITUCIONAL } from '@/conteudo/institucional'
import { linksDeAcesso } from '@/lib/portal'

/** Cabeçalho fixo: marca à esquerda; Entrar e Criar conta (no Portal) à direita. */
export function Cabecalho() {
  const { entrar, criarConta } = linksDeAcesso()
  return (
    <header className="cabecalho">
      <div className="conteiner cabecalho-conteudo">
        <a href="#inicio" className="cabecalho-marca">
          <span className="cabecalho-simbolo" aria-hidden="true">
            P
          </span>
          {INSTITUCIONAL.titulo}
        </a>
        <nav className="cabecalho-acoes" aria-label="Acesso ao portal">
          <a className="botao botao-secundario" href={entrar}>
            Entrar
          </a>
          <a className="botao" href={criarConta}>
            Criar conta
          </a>
        </nav>
      </div>
    </header>
  )
}
