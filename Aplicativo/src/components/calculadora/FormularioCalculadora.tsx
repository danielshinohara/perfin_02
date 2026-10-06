'use client'

import { useActionState } from 'react'
import { calcularCorrecao, type EstadoCalculadora } from '@/app/(portal)/calculadora/acoes'

const ESTADO_INICIAL: EstadoCalculadora = { erro: null, resultado: null }
const INDICES = [
  ['IPCA', 'IPCA'],
  ['IGPM', 'IGP-M'],
  ['INPC', 'INPC'],
  ['CDI', 'CDI'],
] as const

export function FormularioCalculadora({ hoje }: { hoje: string }) {
  const [estado, acao, pendente] = useActionState(calcularCorrecao, ESTADO_INICIAL)
  return (
    <>
      <form
        action={acao}
        className="cartao"
        style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', alignItems: 'end' }}
      >
        <label className="campo">
          Valor (R$)
          <input name="valor" inputMode="decimal" placeholder="1.000,00" required maxLength={20} />
        </label>
        <label className="campo">
          Índice
          <select name="indice" defaultValue="IPCA">
            {INDICES.map(([codigo, nome]) => (
              <option key={codigo} value={codigo}>
                {nome}
              </option>
            ))}
          </select>
        </label>
        <label className="campo">
          Data inicial
          <input type="date" name="inicio" min="2015-01-01" max={hoje} required />
        </label>
        <label className="campo">
          Data final
          <input type="date" name="fim" min="2015-01-01" max={hoje} defaultValue={hoje} required />
        </label>
        <button type="submit" className="botao" disabled={pendente}>
          {pendente ? 'Calculando…' : 'Calcular'}
        </button>
      </form>
      {estado.erro && (
        <p className="aviso aviso-alerta" role="alert">
          {estado.erro}
        </p>
      )}
      {estado.resultado && (
        <section className="cartao" aria-live="polite">
          <h2>Resultado</h2>
          <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--cor-texto)', margin: 0 }}>{estado.resultado.valorCorrigido}</p>
          <p>{estado.resultado.descricao}</p>
          <p>
            Variação no período: <strong>{estado.resultado.variacao}</strong> · Fator acumulado: <strong>{estado.resultado.fator}</strong>
          </p>
          {estado.resultado.aviso && <p className="aviso aviso-atencao">{estado.resultado.aviso}</p>}
        </section>
      )}
    </>
  )
}
