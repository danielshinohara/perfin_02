'use client'

import { useActionState } from 'react'
import { recuperarSenha } from '@/app/login/acoes'
import estilos from '@/app/autenticacao.module.css'
import { ESTADO_INICIAL, MensagemFormulario } from './MensagemFormulario'

export function FormularioRecuperar() {
  const [estado, acao, pendente] = useActionState(recuperarSenha, ESTADO_INICIAL)
  if (estado.sucesso) return <MensagemFormulario estado={estado} />
  return (
    <form action={acao} className={estilos.formulario}>
      <label className="campo">
        E-mail da conta
        <input name="email" type="email" autoComplete="email" required maxLength={254} />
      </label>
      <MensagemFormulario estado={estado} />
      <button type="submit" className="botao" disabled={pendente}>
        {pendente ? 'Enviando…' : 'Enviar link'}
      </button>
    </form>
  )
}
