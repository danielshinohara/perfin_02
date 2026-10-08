import { exigirUsuario } from '@/lib/auth/sessao'
import { contarPendentes } from '@/lib/servicos/admin'
import { NavegacaoInferior } from '@/components/portal/NavegacaoInferior'
import { NavegacaoLateral } from '@/components/portal/NavegacaoLateral'
import { GerenciadorPwa } from '@/components/pwa/GerenciadorPwa'
import estilos from '../portal.module.css'

export default async function LayoutPortal({ children }: { children: React.ReactNode }) {
  const sessao = await exigirUsuario()
  const pendentes = sessao.papel === 'admin' ? await contarPendentes() : 0
  return (
    <div className={estilos.estrutura}>
      <NavegacaoLateral sessao={sessao} pendentes={pendentes} />
      <main className={estilos.conteudo} id="conteudo">
        <GerenciadorPwa geradoEm={new Date().toISOString()} />
        {children}
      </main>
      <NavegacaoInferior />
    </div>
  )
}
