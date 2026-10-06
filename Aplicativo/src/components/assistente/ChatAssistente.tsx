'use client'

import { useRef, useState } from 'react'
import { enviarPost } from '@/lib/cliente/requisicao'
import { TAMANHO_MAXIMO_PERGUNTA } from '@/lib/gemini/limites'

interface Mensagem {
  id: number
  autor: 'voce' | 'assistente'
  texto: string
  erro?: boolean
}

const SUGESTOES = ['Por que o juro real mudou no período?', 'Como o IGP-M se compara ao IPCA?', 'O IPCA está dentro da meta?']

export function ChatAssistente({ busca }: { busca: string }) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [pergunta, setPergunta] = useState('')
  const [aguardando, setAguardando] = useState(false)
  const proximoId = useRef(0)

  const perguntar = async (texto: string) => {
    const limpo = texto.trim()
    if (limpo.length < 3 || aguardando) return
    const id = (proximoId.current += 2)
    setMensagens((atual) => [...atual, { id, autor: 'voce', texto: limpo }])
    setPergunta('')
    setAguardando(true)
    const resposta = await enviarPost<{ resposta: string }>('/api/assistente', { pergunta: limpo, busca })
    setAguardando(false)
    setMensagens((atual) => [
      ...atual,
      resposta.dados
        ? { id: id + 1, autor: 'assistente', texto: resposta.dados.resposta }
        : { id: id + 1, autor: 'assistente', texto: resposta.erro ?? 'Algo deu errado.', erro: true },
    ])
  }

  return (
    <section className="cartao pilha" aria-label="Conversa com o assistente">
      <ol aria-live="polite" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.75rem' }}>
        {mensagens.length === 0 && <li>Faça uma pergunta sobre os indicadores do período filtrado.</li>}
        {mensagens.map((m) => (
          <li
            key={m.id}
            className={m.erro ? 'aviso aviso-alerta' : undefined}
            style={{
              justifySelf: m.autor === 'voce' ? 'end' : 'start',
              maxWidth: 'min(100%, 720px)',
              whiteSpace: 'pre-wrap',
              padding: '0.75rem 1rem',
              borderRadius: 10,
              background: m.erro ? undefined : m.autor === 'voce' ? 'var(--cor-superficie-2)' : 'var(--cor-info-fundo)',
              color: m.erro ? undefined : 'var(--cor-texto)',
            }}
          >
            <span className="sr-only">{m.autor === 'voce' ? 'Você: ' : 'Assistente: '}</span>
            {m.texto}
          </li>
        ))}
        {aguardando && <li>Analisando os dados…</li>}
      </ol>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {SUGESTOES.map((s) => (
          <button key={s} type="button" className="botao botao-secundario" onClick={() => perguntar(s)} disabled={aguardando}>
            {s}
          </button>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void perguntar(pergunta)
        }}
        style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}
      >
        <label className="campo" style={{ flex: '1 1 320px' }}>
          Sua pergunta
          <textarea value={pergunta} onChange={(e) => setPergunta(e.target.value)} maxLength={TAMANHO_MAXIMO_PERGUNTA} rows={2} required minLength={3} />
        </label>
        <button type="submit" className="botao" disabled={aguardando}>
          {aguardando ? 'Aguarde…' : 'Perguntar'}
        </button>
      </form>
    </section>
  )
}
