import estilos from '@/app/autenticacao.module.css'

export function MarcaPerfin() {
  return (
    <div className={estilos.marca}>
      <span className={estilos.simbolo} aria-hidden="true">
        P
      </span>
      Portal Perfin
    </div>
  )
}
