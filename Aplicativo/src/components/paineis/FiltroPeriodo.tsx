import type { Filtros } from '@/lib/dominio/periodo'
import { PRIMEIRO_MES_DISPONIVEL } from '@/lib/dominio/periodo'
import { NOMES_INDICADORES } from '@/lib/dominio/nomes'
import type { CodigoIndicador, Mes } from '@/lib/dominio/tipos'

interface Props {
  filtros: Filtros
  mesMaximo: Mes
  /** Indicadores que fazem sentido nesta tela (o filtro mostra só eles). */
  opcoes?: CodigoIndicador[]
  aviso?: string | null
}

/** Filtro por período e indicadores. É um formulário GET: funciona sem JavaScript e mantém a URL compartilhável. */
export function FiltroPeriodo({ filtros, mesMaximo, opcoes, aviso }: Props) {
  return (
    <form method="get" className="cartao" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }} aria-label="Filtros">
      <label className="campo">
        De
        <input type="month" name="inicio" defaultValue={filtros.inicio} min={PRIMEIRO_MES_DISPONIVEL} max={mesMaximo} required />
      </label>
      <label className="campo">
        Até
        <input type="month" name="fim" defaultValue={filtros.fim} min={PRIMEIRO_MES_DISPONIVEL} max={mesMaximo} required />
      </label>
      {opcoes && opcoes.length > 1 && (
        <fieldset style={{ border: 0, padding: 0, margin: 0, display: 'flex', flexWrap: 'wrap', gap: '0.25rem 1rem' }}>
          <legend className="rotulo" style={{ marginBottom: '0.25rem' }}>
            Indicadores
          </legend>
          {opcoes.map((codigo) => (
            <label key={codigo} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', minHeight: 44, color: 'var(--cor-texto)' }}>
              <input type="checkbox" name="ind" value={codigo} defaultChecked={filtros.indicadores.includes(codigo)} />
              {NOMES_INDICADORES[codigo]}
            </label>
          ))}
        </fieldset>
      )}
      <button type="submit" className="botao">
        Aplicar
      </button>
      {aviso && (
        <p className="aviso aviso-atencao" role="status" style={{ flexBasis: '100%', margin: 0 }}>
          {aviso}
        </p>
      )}
    </form>
  )
}
