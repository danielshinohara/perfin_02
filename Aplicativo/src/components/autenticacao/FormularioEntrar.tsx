'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { entrar } from '@/app/login/acoes'
import estilos from '@/app/autenticacao.module.css'
import { CampoSenha } from './CampoSenha'
import { ESTADO_INICIAL, MensagemFormulario } from './MensagemFormulario'

export function FormularioEntrar() {
  const [estado, acao, pendente] = useActionState(entrar, ESTADO_INICIAL)
  return (
    <form action={acao} className={estilos.formulario}>
      <label className="campo">
        E-mail
        <input name="email" type="email" autoComplete="email" required maxLength={254} />
      </label>
      <CampoSenha nome="senha" rotulo="Senha" autoComplete="current-password" />
      <Link href="/login/recuperar" className={estilos.linkSecundario}>
        Esqueci minha senha
      </Link>
      <MensagemFormulario estado={estado} />
      <button type="submit" className="botao" disabled={pendente}>
        {pendente ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  )
}
