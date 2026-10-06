'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface Props {
  href: string
  rotulo: string
  classe?: string
  classeAtiva?: string
}

export function LinkNavegacao({ href, rotulo, classe, classeAtiva }: Props) {
  const caminho = usePathname()
  const ativo = href === '/' ? caminho === '/' : caminho.startsWith(href)
  return (
    <Link href={href} className={[classe, ativo ? classeAtiva : ''].filter(Boolean).join(' ')} aria-current={ativo ? 'page' : undefined}>
      {rotulo}
    </Link>
  )
}
