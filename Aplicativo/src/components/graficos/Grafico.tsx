'use client'

import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { DadosGrafico, LinhaGrafico, UnidadeGrafico } from '@/lib/dominio/paineis/tipos'
import { formatarNumero } from '@/lib/dominio/formatos'
import { formatarValorGrafico } from '@/lib/dominio/paineis/formatar'

const CORES = ['var(--serie-1)', 'var(--serie-2)', 'var(--serie-3)', 'var(--serie-4)']

function formatarEixo(valor: number, unidade: UnidadeGrafico): string {
  if (unidade === 'moeda') return formatarNumero(valor, 2)
  return formatarNumero(valor, unidade === 'indice' ? 0 : 1)
}

interface Props {
  dados: DadosGrafico
  tipo?: 'linha' | 'barra'
  altura?: number
}

export function Grafico({ dados, tipo = 'linha', altura = 300 }: Props) {
  const { series, linhas, unidade, faixa } = dados
  const temNegativo = linhas.some((l) => series.some((s) => typeof l[s.chave] === 'number' && (l[s.chave] as number) < 0))
  return (
    <div role="img" aria-label={`${dados.titulo}. ${dados.descricao}. Tabela com os valores logo abaixo.`} style={{ width: '100%', height: altura }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={linhas} margin={{ top: 8, right: 12, bottom: 4, left: 0 }} barGap={2}>
          <CartesianGrid vertical={false} stroke="var(--grafico-grade)" />
          <XAxis dataKey="rotulo" tick={{ fill: 'var(--cor-texto-2)', fontSize: 12 }} tickLine={false} axisLine={{ stroke: 'var(--cor-borda)' }} minTickGap={24} />
          <YAxis
            tick={{ fill: 'var(--cor-texto-2)', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={56}
            domain={['auto', 'auto']}
            tickFormatter={(v: number) => formatarEixo(v, unidade)}
          />
          {temNegativo && <ReferenceLine y={0} stroke="var(--cor-texto-2)" />}
          {faixa && (
            <Area
              dataKey={(l: LinhaGrafico) => [l[faixa.inferior], l[faixa.superior]]}
              name={faixa.nome}
              stroke="none"
              fill="var(--grafico-faixa)"
              isAnimationActive={false}
              legendType="square"
            />
          )}
          {series.map((s, i) =>
            tipo === 'barra' ? (
              <Bar key={s.chave} dataKey={s.chave} name={s.nome} fill={CORES[i % CORES.length]} radius={[4, 4, 0, 0]} isAnimationActive={false} />
            ) : (
              <Line
                key={s.chave}
                dataKey={s.chave}
                name={s.nome}
                stroke={CORES[i % CORES.length]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--cor-superficie)' }}
                connectNulls={false}
                isAnimationActive={false}
              />
            ),
          )}
          <Tooltip
            cursor={tipo === 'barra' ? { fill: 'var(--cor-superficie-2)' } : { stroke: 'var(--cor-texto-2)', strokeDasharray: '3 3' }}
            contentStyle={{ background: 'var(--cor-superficie)', border: '1px solid var(--cor-borda)', borderRadius: 8, color: 'var(--cor-texto)' }}
            labelStyle={{ color: 'var(--cor-texto)', fontWeight: 700 }}
            formatter={(valor) => {
              if (Array.isArray(valor)) return valor.map((v) => (typeof v === 'number' ? formatarValorGrafico(v, unidade) : '—')).join(' a ')
              return typeof valor === 'number' ? formatarValorGrafico(valor, unidade) : '—'
            }}
          />
          {(series.length > 1 || faixa) && <Legend wrapperStyle={{ color: 'var(--cor-texto-2)', fontSize: 13 }} />}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
