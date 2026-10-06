'use client'

import { useState } from 'react'
import { enviarPost } from '@/lib/cliente/requisicao'
import { MensagemErro } from '@/components/comum/MensagemErro'

/** Cria um RASCUNHO no Gmail (nunca envia). O usuário revisa e envia pelo próprio Gmail. */
export function BotaoRascunho({ relatorioId, jaCriado }: { relatorioId: string; jaCriado: boolean }) {
  const [estado, setEstado] = useState<'ocioso' | 'criando' | 'criado'>(jaCriado ? 'criado' : 'ocioso')
  const [link, setLink] = useState<string | null>(null)
  const [erro, setErro] = useState<{ texto: string; reconectar: boolean } | null>(null)

  const criar = async () => {
    setEstado('criando')
    setErro(null)
    const resposta = await enviarPost<{ link: string }>(`/api/relatorios/${relatorioId}/rascunho`)
    if (resposta.erro || !resposta.dados) {
      setEstado(jaCriado ? 'criado' : 'ocioso')
      setErro({ texto: resposta.erro ?? 'Algo deu errado.', reconectar: resposta.reconectar })
      return
    }
    setLink(resposta.dados.link)
    setEstado('criado')
  }

  return (
    <>
      <button type="button" className="botao botao-secundario" onClick={criar} disabled={estado === 'criando'}>
        {estado === 'criando' ? 'Criando rascunho…' : estado === 'criado' ? 'Criar outro rascunho' : 'Criar rascunho no Gmail'}
      </button>
      {link && (
        <a href={link} target="_blank" rel="noopener noreferrer" role="status">
          Rascunho criado — abrir no Gmail
        </a>
      )}
      {erro && <MensagemErro texto={erro.texto} reconectar={erro.reconectar} />}
    </>
  )
}
