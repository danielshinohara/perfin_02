import type { EstadoFormulario } from '@/lib/auth/validacao'

/** Erro ou confirmação de um formulário de autenticação (anunciado por leitores de tela). */
export function MensagemFormulario({ estado }: { estado: EstadoFormulario }) {
  return (
    <div aria-live="polite">
      {estado.erro && (
        <p className="aviso aviso-alerta" role="alert">
          {estado.erro}
        </p>
      )}
      {estado.sucesso && (
        <p className="aviso aviso-info" role="status">
          {estado.sucesso}
        </p>
      )}
    </div>
  )
}

export const ESTADO_INICIAL: EstadoFormulario = { erro: null, sucesso: null }
