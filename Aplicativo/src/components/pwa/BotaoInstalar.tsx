'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'

interface EventoInstalacao extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function ehIphoneNoNavegador(): boolean {
  const iphone = /iphone|ipad|ipod/i.test(navigator.userAgent)
  const instalado = window.matchMedia('(display-mode: standalone)').matches || ('standalone' in navigator && navigator.standalone === true)
  return iphone && !instalado
}

function semAssinatura() {
  return () => undefined
}

/** Android/desktop: usa o prompt do navegador. iPhone: mostra o passo a passo (o Safari não tem botão). */
export function BotaoInstalar() {
  const [evento, setEvento] = useState<EventoInstalacao | null>(null)
  // Detectado só no navegador; no servidor fica falso.
  const dicaIphone = useSyncExternalStore(semAssinatura, ehIphoneNoNavegador, () => false)

  useEffect(() => {
    const aoPoderInstalar = (e: Event) => {
      e.preventDefault()
      setEvento(e as EventoInstalacao)
    }
    const aoInstalar = () => setEvento(null)
    window.addEventListener('beforeinstallprompt', aoPoderInstalar)
    window.addEventListener('appinstalled', aoInstalar)
    return () => {
      window.removeEventListener('beforeinstallprompt', aoPoderInstalar)
      window.removeEventListener('appinstalled', aoInstalar)
    }
  }, [])

  if (evento) {
    const instalar = async () => {
      await evento.prompt()
      await evento.userChoice
      setEvento(null)
    }
    return (
      <button type="button" className="botao" onClick={instalar}>
        Instalar app
      </button>
    )
  }
  if (dicaIphone) {
    return (
      <details>
        <summary style={{ cursor: 'pointer', fontWeight: 700 }}>Instalar no iPhone</summary>
        <p style={{ margin: '0.5rem 0 0' }}>No Safari, toque em Compartilhar e depois em “Adicionar à Tela de Início”.</p>
      </details>
    )
  }
  return null
}
