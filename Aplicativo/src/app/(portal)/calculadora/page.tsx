import type { Metadata } from 'next'
import { hojeEmSaoPaulo } from '@/lib/dominio/datas'
import { CabecalhoPagina } from '@/components/paineis/CabecalhoPagina'
import { FormularioCalculadora } from '@/components/calculadora/FormularioCalculadora'

export const metadata: Metadata = { title: 'Calculadora de correção', description: 'Corrija valores por IPCA, IGP-M, INPC ou CDI.' }

export default function PaginaCalculadora() {
  return (
    <>
      <CabecalhoPagina
        titulo="Calculadora de correção"
        descricao="Índices mensais: do mês da data inicial ao mês da data final (inclusive), como na Calculadora do Cidadão do BCB. CDI: da data inicial até a véspera da final."
      />
      <FormularioCalculadora hoje={hojeEmSaoPaulo()} />
    </>
  )
}
