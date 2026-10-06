'use server'

import { exigirUsuario } from '@/lib/auth/sessao'
import { corrigirValor, DadosInsuficientesError, lerEntradaCorrecao } from '@/lib/dominio/correcao'
import { hojeEmSaoPaulo } from '@/lib/dominio/datas'
import { formatarData, formatarMesAno, formatarMoeda, formatarNumero, formatarPercentual } from '@/lib/dominio/formatos'
import { NOMES_INDICADORES } from '@/lib/dominio/nomes'
import { carregarSeries } from '@/lib/servicos/indicadores'
import { criarClienteServidor } from '@/lib/supabase/servidor'

export interface EstadoCalculadora {
  erro: string | null
  resultado: { valorCorrigido: string; descricao: string; variacao: string; fator: string; aviso: string | null } | null
}

/** Calcula a correção no servidor (dados via RLS); o valor nunca vai para a URL. */
export async function calcularCorrecao(_estado: EstadoCalculadora, formulario: FormData): Promise<EstadoCalculadora> {
  await exigirUsuario()
  const campo = (nome: string) => String(formulario.get(nome) ?? '').slice(0, 30)
  const { entrada, erro } = lerEntradaCorrecao(
    { valor: campo('valor'), indice: campo('indice'), inicio: campo('inicio'), fim: campo('fim') },
    hojeEmSaoPaulo(),
  )
  if (!entrada) return { erro, resultado: null }

  const supabase = await criarClienteServidor()
  const series = await carregarSeries(supabase, [entrada.indice], `${entrada.inicio.slice(0, 7)}-01`, entrada.fim)
  try {
    const r = corrigirValor(entrada.valor, entrada.indice, series[entrada.indice] ?? [], entrada.inicio, entrada.fim)
    const ate = entrada.indice === 'CDI' ? formatarData(r.aplicadoAte) : formatarMesAno(r.aplicadoAte.slice(0, 7))
    return {
      erro: null,
      resultado: {
        valorCorrigido: formatarMoeda(r.valorCorrigido),
        descricao: `${formatarMoeda(entrada.valor)} corrigidos pelo ${NOMES_INDICADORES[entrada.indice]} de ${formatarData(entrada.inicio)} a ${formatarData(entrada.fim)}.`,
        variacao: formatarPercentual(r.variacaoPct, 4),
        fator: formatarNumero(r.fator, 8),
        aviso: r.parcial ? `O ${NOMES_INDICADORES[entrada.indice]} ainda não tem dados até a data final: correção aplicada até ${ate}.` : null,
      },
    }
  } catch (e) {
    if (e instanceof DadosInsuficientesError) {
      return { erro: 'O índice não tem dados suficientes para esse período (os índices mensais saem cerca de 10 dias após o fim do mês).', resultado: null }
    }
    throw e
  }
}
