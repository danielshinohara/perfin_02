'use client'

import { useId, useState } from 'react'
import estilos from '@/app/autenticacao.module.css'

interface Props {
  nome: string
  rotulo: string
  autoComplete: 'current-password' | 'new-password'
  minLength?: number
  descricao?: string
}

/** Campo de senha com botão para mostrar/ocultar. */
export function CampoSenha({ nome, rotulo, autoComplete, minLength, descricao }: Props) {
  const [visivel, setVisivel] = useState(false)
  const id = useId()
  const idDescricao = descricao ? `${id}-descricao` : undefined
  return (
    <div className="campo">
      <label htmlFor={id}>{rotulo}</label>
      <div className={estilos.campoSenha}>
        <input
          id={id}
          name={nome}
          type={visivel ? 'text' : 'password'}
          autoComplete={autoComplete}
          required
          minLength={minLength}
          maxLength={200}
          aria-describedby={idDescricao}
        />
        <button
          type="button"
          className={estilos.botaoMostrar}
          onClick={() => setVisivel((v) => !v)}
          aria-pressed={visivel}
          aria-controls={id}
        >
          {visivel ? 'Ocultar' : 'Mostrar'}
        </button>
      </div>
      {descricao && (
        <span id={idDescricao} className={estilos.dica}>
          {descricao}
        </span>
      )}
    </div>
  )
}
