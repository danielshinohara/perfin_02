'use client'

import { useActionState } from 'react'
import { definirNovaSenha } from '@/app/conta/nova-senha/acoes'
import estilos from '@/app/autenticacao.module.css'
import { SENHA_MINIMA } from '@/lib/auth/validacao'
import { CampoSenha } from './CampoSenha'
import { ESTADO_INICIAL, MensagemFormulario } from './MensagemFormulario'

export function FormularioNovaSenha() {
  const [estado, acao, pendente] = useActionState(definirNovaSenha, ESTADO_INICIAL)
  return (
    <form action={acao} className={estilos.formulario}>
      <CampoSenha
        nome="senha"
        rotulo="Nova senha"
        autoComplete="new-password"
        minLength={SENHA_MINIMA}
        descricao={`Mínimo de ${SENHA_MINIMA} caracteres. Use letras, números e símbolos.`}
      />
      <CampoSenha nome="confirmacao" rotulo="Confirme a nova senha" autoComplete="new-password" minLength={SENHA_MINIMA} />
      <MensagemFormulario estado={estado} />
      <button type="submit" className="botao" disabled={pendente}>
        {pendente ? 'Salvando…' : 'Salvar nova senha'}
      </button>
    </form>
  )
}
