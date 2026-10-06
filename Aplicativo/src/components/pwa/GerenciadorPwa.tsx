'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { formatarDataHora } from '@/lib/dominio/formatos'

function assinarConexao(aoMudar: () => void) {
  window.addEventListener('online', aoMudar)
  window.addEventListener('offline', aoMudar)
  return () => {
    window.removeEventListener('online', aoMudar)
    window.removeEventListener('offline', aoMudar)
  }
}

/**
 * Registra o service worker, avisa quando há versão nova e mostra o aviso de modo offline
 * com o horário em que os dados exibidos foram gerados.
 */
export function GerenciadorPwa({ geradoEm }: { geradoEm: string }) {
  const offline = useSyncExternalStore(assinarConexao, () => !navigator.onLine, () => false)
  const [novaVersao, setNovaVersao] = useState<ServiceWorker | null>(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    let recarregando = false
    const aoTrocarControlador = () => {
      if (recarregando) return
      recarregando = true
      window.location.reload()
    }
    navigator.serviceWorker.addEventListener('controllerchange', aoTrocarControlador)
    navigator.serviceWorker
      .register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .then((registro) => {
        if (registro.waiting && navigator.serviceWorker.controller) setNovaVersao(registro.waiting)
        registro.addEventListener('updatefound', () => {
          const instalando = registro.installing
          instalando?.addEventListener('statechange', () => {
            if (instalando.state === 'installed' && navigator.serviceWorker.controller) setNovaVersao(instalando)
          })
        })
      })
      .catch((erro: unknown) => console.error('Service worker não registrado', erro instanceof Error ? erro.message : erro))
    return () => navigator.serviceWorker.removeEventListener('controllerchange', aoTrocarControlador)
  }, [])

  return (
    <>
      {offline && (
        <p className="aviso aviso-atencao" role="status">
          Sem conexão — dados de {formatarDataHora(geradoEm)}. Relatórios, agenda e assistente voltam quando a internet
          voltar.
        </p>
      )}
      {novaVersao && (
        <p className="aviso aviso-info" role="status" style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          Nova versão disponível.
          <button type="button" className="botao" onClick={() => novaVersao.postMessage({ tipo: 'ATIVAR_NOVA_VERSAO' })}>
            Atualizar
          </button>
        </p>
      )}
    </>
  )
}
