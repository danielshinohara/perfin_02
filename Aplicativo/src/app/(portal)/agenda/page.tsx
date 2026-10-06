import type { Metadata } from 'next'
import { exigirUsuario } from '@/lib/auth/sessao'
import { listarProximasReunioes } from '@/lib/google/calendar'
import type { Reuniao } from '@/lib/google/eventos'
import { GoogleReconectarError } from '@/lib/google/http'
import { obterAccessToken } from '@/lib/servicos/google-tokens'
import { criarClienteServidor } from '@/lib/supabase/servidor'
import { CabecalhoPagina } from '@/components/paineis/CabecalhoPagina'
import { ListaReunioes } from '@/components/agenda/ListaReunioes'
import { AvisoEntrarComGoogle } from '@/components/portal/AvisoEntrarComGoogle'
import { MensagemErro } from '@/components/comum/MensagemErro'

export const metadata: Metadata = { title: 'Agenda', description: 'Suas próximas reuniões do Google Agenda.' }
export const dynamic = 'force-dynamic'

type Resultado = { reunioes: Reuniao[] } | { erro: string; reconectar: boolean }

async function carregarReunioes(userId: string): Promise<Resultado> {
  try {
    const supabase = await criarClienteServidor()
    const token = await obterAccessToken(supabase, userId)
    return { reunioes: await listarProximasReunioes(token, new Date()) }
  } catch (erro) {
    if (erro instanceof GoogleReconectarError) return { erro: erro.message, reconectar: true }
    console.error('[agenda]', erro instanceof Error ? erro.message : 'erro desconhecido')
    return { erro: 'Não foi possível carregar sua agenda agora. Tente novamente em instantes.', reconectar: false }
  }
}

export default async function PaginaAgenda() {
  const sessao = await exigirUsuario()
  const cabecalho = <CabecalhoPagina titulo="Agenda" descricao="Suas próximas reuniões nos próximos 14 dias (Google Agenda)." />
  if (sessao.metodo !== 'google') {
    return (
      <>
        {cabecalho}
        <AvisoEntrarComGoogle recurso="ver sua agenda" />
      </>
    )
  }
  const resultado = await carregarReunioes(sessao.userId)
  return (
    <>
      {cabecalho}
      {'erro' in resultado ? <MensagemErro texto={resultado.erro} reconectar={resultado.reconectar} /> : <ListaReunioes reunioes={resultado.reunioes} />}
    </>
  )
}
