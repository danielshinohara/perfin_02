'use client'

import { useActionState } from 'react'
import { entrarComoAdmin, type EstadoLoginAdmin } from '@/app/login/acoes'

const ESTADO_INICIAL: EstadoLoginAdmin = { erro: null }

export function FormularioAdmin() {
  const [estado, acao, pendente] = useActionState(entrarComoAdmin, ESTADO_INICIAL)
  return (
    <form action={acao} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '0.5rem' }}>
      <label className="campo">
        E-mail
        <input name="email" type="email" autoComplete="username" required maxLength={254} />
      </label>
      <label className="campo">
        Senha
        <input name="senha" type="password" autoComplete="current-password" required maxLength={200} />
      </label>
      {estado.erro && (
        <p className="aviso aviso-alerta" role="alert">
          {estado.erro}
        </p>
      )}
      <button type="submit" className="botao botao-secundario" disabled={pendente}>
        {pendente ? 'Entrando…' : 'Entrar como administrador'}
      </button>
    </form>
  )
}
