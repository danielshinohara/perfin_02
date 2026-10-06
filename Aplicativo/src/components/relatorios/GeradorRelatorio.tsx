'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { enviarPost } from '@/lib/cliente/requisicao'
import { MensagemErro } from '@/components/comum/MensagemErro'

interface Props {
  mesPadrao: string
  mesMaximo: string
}

export function GeradorRelatorio({ mesPadrao, mesMaximo }: Props) {
  const router = useRouter()
  const [mes, setMes] = useState(mesPadrao)
  const [gerando, setGerando] = useState(false)
  const [erro, setErro] = useState<{ texto: string; reconectar: boolean } | null>(null)
  const [, iniciarTransicao] = useTransition()

  const gerar = async (evento: React.FormEvent) => {
    evento.preventDefault()
    setGerando(true)
    setErro(null)
    const resposta = await enviarPost<{ relatorio: { planilhaUrl: string } }>('/api/relatorios', { mes })
    setGerando(false)
    if (resposta.erro) {
      setErro({ texto: resposta.erro, reconectar: resposta.reconectar })
      return
    }
    iniciarTransicao(() => router.refresh())
  }

  return (
    <form onSubmit={gerar} className="cartao" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
      <label className="campo">
        Mês de referência
        <input type="month" value={mes} min="2016-01" max={mesMaximo} onChange={(e) => setMes(e.target.value)} required />
      </label>
      <button type="submit" className="botao" disabled={gerando}>
        {gerando ? 'Gerando planilha…' : 'Gerar relatório do mês'}
      </button>
      {erro && <MensagemErro texto={erro.texto} reconectar={erro.reconectar} />}
    </form>
  )
}
