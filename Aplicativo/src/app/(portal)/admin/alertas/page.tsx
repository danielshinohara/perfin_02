import type { Metadata } from 'next'
import { exigirAdmin } from '@/lib/auth/sessao'
import { carregarRegras } from '@/lib/servicos/indicadores'
import { criarClienteServidor } from '@/lib/supabase/servidor'
import { CabecalhoPagina } from '@/components/paineis/CabecalhoPagina'
import { FormularioRegra } from '@/components/admin/FormularioRegra'

export const metadata: Metadata = { title: 'Alertas', description: 'Configurar as regras de insights e alertas.' }

export default async function PaginaAlertas() {
  await exigirAdmin()
  const regras = await carregarRegras(await criarClienteServidor())
  return (
    <>
      <CabecalhoPagina
        titulo="Configurar alertas"
        descricao="Ligue ou desligue cada regra e ajuste o limite. Quando um indicador passa do limite, o insight vira alerta para todos os usuários."
      />
      <div className="grade-larga">
        {regras.map((regra) => (
          <FormularioRegra key={regra.codigo} regra={regra} />
        ))}
      </div>
    </>
  )
}
