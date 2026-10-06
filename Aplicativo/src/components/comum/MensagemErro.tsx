export function MensagemErro({ texto, reconectar }: { texto: string; reconectar: boolean }) {
  return (
    <div className="aviso aviso-alerta" role="alert" style={{ flexBasis: '100%' }}>
      <p style={{ margin: 0 }}>{texto}</p>
      {reconectar && (
        <form action="/auth/google" method="post" style={{ marginTop: '0.5rem' }}>
          <button type="submit" className="botao">
            Entrar novamente com Google
          </button>
        </form>
      )}
    </div>
  )
}
