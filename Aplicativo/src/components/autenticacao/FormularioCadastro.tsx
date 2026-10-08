'use client'

import { useActionState } from 'react'
import { cadastrar } from '@/app/login/acoes'
import estilos from '@/app/autenticacao.module.css'
import { SENHA_MINIMA } from '@/lib/auth/validacao'
import { CampoSenha } from './CampoSenha'
import { ESTADO_INICIAL, MensagemFormulario } from './MensagemFormulario'

export function FormularioCadastro() {
  const [estado, acao, pendente] = useActionState(cadastrar, ESTADO_INICIAL)
  if (estado.sucesso) return <MensagemFormulario estado={estado} />
  return (
    <form action={acao} className={estilos.formulario}>
      <label className="campo">
        Nome
        <input name="nome" type="text" autoComplete="name" required minLength={2} maxLength={120} />
      </label>
      <label className="campo">
        E-mail
        <input name="email" type="email" autoComplete="email" required maxLength={254} />
      </label>
      <CampoSenha
        nome="senha"
        rotulo="Senha"
        autoComplete="new-password"
        minLength={SENHA_MINIMA}
        descricao={`Mínimo de ${SENHA_MINIMA} caracteres. Use letras, números e símbolos.`}
      />
      <CampoSenha nome="confirmacao" rotulo="Confirme a senha" autoComplete="new-password" minLength={SENHA_MINIMA} />
      <MensagemFormulario estado={estado} />
      <button type="submit" className="botao" disabled={pendente}>
        {pendente ? 'Criando conta…' : 'Criar conta'}
      </button>
      <p className={estilos.legal}>Novas contas são liberadas por um administrador da Perfin.</p>
    </form>
  )
}
