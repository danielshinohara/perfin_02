import estilos from '@/app/portal.module.css'
import { ITENS_CELULAR } from './itens-navegacao'
import { LinkNavegacao } from './LinkNavegacao'

export function NavegacaoInferior() {
  return (
    <nav className={estilos.navegacaoInferior} aria-label="Navegação principal">
      {ITENS_CELULAR.map((item) => (
        <LinkNavegacao key={item.href} {...item} />
      ))}
    </nav>
  )
}
