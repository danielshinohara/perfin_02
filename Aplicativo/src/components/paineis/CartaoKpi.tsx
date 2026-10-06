import { formatarValorKpi, type Kpi } from '@/lib/dominio/resumo'
import { formatarData, formatarPercentual } from '@/lib/dominio/formatos'

const ROTULO_META = { abaixo: 'Abaixo do piso da meta', dentro: 'Dentro da meta', acima: 'Acima do teto da meta' } as const

export function CartaoKpi({ kpi }: { kpi: Kpi }) {
  const variacaoPositiva = kpi.variacao?.valor.gte(0)
  return (
    <article className="cartao" style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      <h2 className="rotulo" style={{ margin: 0 }}>
        {kpi.titulo}
      </h2>
      <p style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--cor-texto)', margin: 0, fontVariantNumeric: 'tabular-nums' }}>
        {formatarValorKpi(kpi)}
      </p>
      {kpi.variacao && (
        <p className={variacaoPositiva ? 'positivo' : 'negativo'} style={{ margin: 0, fontWeight: 700 }}>
          {variacaoPositiva ? '▲' : '▼'} {formatarPercentual(kpi.variacao.valor, 2, true)} {kpi.variacao.rotulo}
        </p>
      )}
      {kpi.situacaoMeta && (
        <p className={kpi.situacaoMeta === 'dentro' ? 'positivo' : 'negativo'} style={{ margin: 0, fontWeight: 700 }}>
          {kpi.situacaoMeta === 'dentro' ? '●' : '▲'} {ROTULO_META[kpi.situacaoMeta]}
        </p>
      )}
      {kpi.complemento && <p style={{ margin: 0, fontSize: '0.875rem' }}>{kpi.complemento}</p>}
      <p style={{ margin: 0, fontSize: '0.8125rem' }}>{kpi.referencia ? `Ref. ${formatarData(kpi.referencia)}` : 'Sem dado disponível'}</p>
    </article>
  )
}
