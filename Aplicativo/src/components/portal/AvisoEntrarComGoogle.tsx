export function AvisoEntrarComGoogle({ recurso }: { recurso: string }) {
  return (
    <div className="aviso aviso-info" role="status">
      <p style={{ color: 'var(--cor-texto)' }}>
        Para {recurso}, entre com sua conta Google. A sessão de administrador (e-mail e senha) não tem acesso ao Google.
      </p>
      <form action="/auth/google" method="post">
        <button type="submit" className="botao">
          Entrar com Google
        </button>
      </form>
    </div>
  )
}
