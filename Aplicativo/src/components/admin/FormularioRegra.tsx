'use client'

import { useActionState } from 'react'
import { salvarRegra, type EstadoRegra } from '@/app/(portal)/admin/alertas/acoes'
import { REGRAS_COM_LIMITE_INFERIOR, usaLimite } from '@/lib/dominio/insights/configuracao'
import type { RegraAlerta } from '@/lib/dominio/tipos'

const ESTADO_INICIAL: EstadoRegra = { mensagem: null, erro: false }

function paraCampo(valor: string | null): string {
  return valor === null ? '' : String(Number(valor)).replace('.', ',')
}

export function FormularioRegra({ regra }: { regra: RegraAlerta }) {
  const [estado, acao, pendente] = useActionState(salvarRegra, ESTADO_INICIAL)
  const comLimite = usaLimite(regra.codigo)
  return (
    <form action={acao} className="cartao" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <input type="hidden" name="codigo" value={regra.codigo} />
      <h2 style={{ marginBottom: 0 }}>{regra.descricao}</h2>
      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minHeight: 44, color: 'var(--cor-texto)', fontWeight: 600 }}>
        <input type="checkbox" name="ativa" defaultChecked={regra.ativa} /> Regra ativa
      </label>
      {comLimite && (
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <label className="campo" style={{ flex: '1 1 140px' }}>
            Limite
            <input name="limite" inputMode="decimal" defaultValue={paraCampo(regra.limite)} maxLength={12} required />
          </label>
          {REGRAS_COM_LIMITE_INFERIOR.includes(regra.codigo) && (
            <label className="campo" style={{ flex: '1 1 140px' }}>
              Limite inferior
              <input name="limiteSecundario" inputMode="decimal" defaultValue={paraCampo(regra.limiteSecundario)} maxLength={12} />
            </label>
          )}
        </div>
      )}
      <label className="campo">
        Severidade quando disparar
        <select name="severidade" defaultValue={regra.severidade}>
          <option value="alerta">Alerta</option>
          <option value="atencao">Atenção</option>
          <option value="informativo">Informativo</option>
        </select>
      </label>
      <button type="submit" className="botao" disabled={pendente}>
        {pendente ? 'Salvando…' : 'Salvar'}
      </button>
      {estado.mensagem && (
        <p className={`aviso ${estado.erro ? 'aviso-alerta' : 'aviso-info'}`} role="status" style={{ margin: 0 }}>
          {estado.mensagem}
        </p>
      )}
    </form>
  )
}
