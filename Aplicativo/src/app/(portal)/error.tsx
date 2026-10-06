'use client'

export default function ErroPortal({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="aviso aviso-alerta" role="alert">
      <h2 style={{ color: 'inherit' }}>Não foi possível carregar esta página</h2>
      <p>Pode ser uma instabilidade momentânea ou falta de conexão. Os detalhes técnicos foram registrados no servidor.</p>
      <button type="button" className="botao" onClick={reset}>
        Tentar novamente
      </button>
    </div>
  )
}
