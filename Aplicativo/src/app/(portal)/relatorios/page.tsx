import type { Metadata } from 'next'
import { exigirUsuario } from '@/lib/auth/sessao'
import { hojeEmSaoPaulo, mesDe } from '@/lib/dominio/datas'
import { formatarDataHora, formatarMesAno } from '@/lib/dominio/formatos'
import { mesPadraoRelatorio } from '@/lib/dominio/periodo'
import { listarRelatorios } from '@/lib/servicos/relatorios'
import { criarClienteServidor } from '@/lib/supabase/servidor'
import { CabecalhoPagina } from '@/components/paineis/CabecalhoPagina'
import { AvisoEntrarComGoogle } from '@/components/portal/AvisoEntrarComGoogle'
import { BotaoRascunho } from '@/components/relatorios/BotaoRascunho'
import { GeradorRelatorio } from '@/components/relatorios/GeradorRelatorio'

export const metadata: Metadata = { title: 'Relatórios', description: 'Relatório mensal de indicadores: Planilha Google, Excel e rascunho no Gmail.' }

export default async function PaginaRelatorios() {
  const sessao = await exigirUsuario()
  const cabecalho = (
    <CabecalhoPagina
      titulo="Relatório do mês"
      descricao="Gera uma Planilha Google no seu Drive com o resumo dos indicadores, insights, séries e o gráfico IPCA × meta."
    />
  )
  if (sessao.metodo !== 'google') {
    return (
      <>
        {cabecalho}
        <AvisoEntrarComGoogle recurso="gerar relatórios no Google Drive e rascunhos no Gmail" />
      </>
    )
  }

  const hoje = hojeEmSaoPaulo()
  const relatorios = await listarRelatorios(await criarClienteServidor(), sessao.userId)
  return (
    <>
      {cabecalho}
      <GeradorRelatorio mesPadrao={mesPadraoRelatorio(hoje)} mesMaximo={mesDe(hoje)} />
      <section className="cartao" aria-labelledby="titulo-historico">
        <h2 id="titulo-historico">Histórico</h2>
        {relatorios.length === 0 ? (
          <p className="aviso aviso-info">Você ainda não gerou nenhum relatório.</p>
        ) : (
          <div className="rolagem-horizontal">
            <table className="tabela">
              <thead>
                <tr>
                  <th scope="col">Mês</th>
                  <th scope="col">Gerado em</th>
                  <th scope="col">Ações</th>
                </tr>
              </thead>
              <tbody>
                {relatorios.map((r) => (
                  <tr key={r.id}>
                    <th scope="row">{formatarMesAno(r.mesReferencia)}</th>
                    <td>{formatarDataHora(r.criadoEm)}</td>
                    <td style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <a className="botao botao-secundario" href={r.planilhaUrl} target="_blank" rel="noopener noreferrer">
                        Abrir planilha
                      </a>
                      <a className="botao botao-secundario" href={`/api/relatorios/${r.id}/xlsx`} download>
                        Baixar Excel
                      </a>
                      <BotaoRascunho relatorioId={r.id} jaCriado={Boolean(r.rascunhoGmailId)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}
