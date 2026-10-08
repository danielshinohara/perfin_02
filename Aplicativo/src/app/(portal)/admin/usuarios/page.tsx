import type { Metadata } from 'next'
import Link from 'next/link'
import { exigirAdmin } from '@/lib/auth/sessao'
import { SITUACOES } from '@/lib/auth/validacao'
import { formatarDataHora } from '@/lib/dominio/formatos'
import { acoesDisponiveis, contarPorSituacao, filtroDeSituacao, ROTULOS_SITUACAO } from '@/lib/dominio/usuarios'
import { listarUsuarios } from '@/lib/servicos/admin'
import { criarClienteServidor } from '@/lib/supabase/servidor'
import { CabecalhoPagina } from '@/components/paineis/CabecalhoPagina'
import { alterarSituacao } from './acoes'

export const metadata: Metadata = { title: 'Usuários', description: 'Aprovar, bloquear ou desbloquear o acesso ao portal.' }

const PROVEDORES = { google: 'Google', email: 'E-mail e senha' } as const

const VAZIO = {
  pendente: 'Nenhum cadastro aguardando aprovação.',
  ativo: 'Nenhum usuário ativo.',
  bloqueado: 'Nenhum usuário bloqueado.',
} as const

export default async function PaginaUsuarios({ searchParams }: { searchParams: Promise<{ situacao?: string }> }) {
  const sessao = await exigirAdmin()
  const usuarios = await listarUsuarios(await criarClienteServidor())
  const contagem = contarPorSituacao(usuarios)
  const filtro = filtroDeSituacao((await searchParams).situacao, contagem)
  const visiveis = usuarios.filter((u) => u.situacao === filtro)

  return (
    <>
      <CabecalhoPagina
        titulo="Usuários"
        descricao="Novas contas (e-mail e senha ou Google) aguardam sua aprovação. Usuários bloqueados veem “Acesso não autorizado”."
      />
      <nav aria-label="Filtrar por situação" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {SITUACOES.map((s) => (
          <Link
            key={s}
            href={`/admin/usuarios?situacao=${s}`}
            className={`botao ${s === filtro ? '' : 'botao-secundario'}`}
            aria-current={s === filtro ? 'page' : undefined}
          >
            {ROTULOS_SITUACAO[s]} ({contagem[s]})
          </Link>
        ))}
      </nav>
      <section className="cartao">
        {visiveis.length === 0 ? (
          <p className="aviso aviso-info">{VAZIO[filtro]}</p>
        ) : (
          <div className="rolagem-horizontal">
            <table className="tabela">
              <thead>
                <tr>
                  <th scope="col">Usuário</th>
                  <th scope="col">Como entra</th>
                  <th scope="col">Cadastro</th>
                  <th scope="col">Último acesso</th>
                  <th scope="col">Ação</th>
                </tr>
              </thead>
              <tbody>
                {visiveis.map((u) => (
                  <tr key={u.userId}>
                    <th scope="row">
                      {u.nome ?? u.email}
                      {u.nome && <span style={{ display: 'block', fontWeight: 400 }}>{u.email}</span>}
                      {!u.emailConfirmado && (
                        <span className="negativo" style={{ display: 'block', fontWeight: 400 }}>
                          ▲ E-mail ainda não confirmado
                        </span>
                      )}
                    </th>
                    <td>{u.provedor ? PROVEDORES[u.provedor] : '—'}</td>
                    <td>{formatarDataHora(u.criadoEm)}</td>
                    <td>{u.ultimoAcessoEm ? formatarDataHora(u.ultimoAcessoEm) : 'Nunca'}</td>
                    <td>
                      {u.userId === sessao.userId ? (
                        <span>Você</span>
                      ) : (
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {acoesDisponiveis(u.situacao, u.emailConfirmado).map((acao) => (
                            <form key={acao.situacao} action={alterarSituacao}>
                              <input type="hidden" name="userId" value={u.userId} />
                              <input type="hidden" name="situacao" value={acao.situacao} />
                              <button
                                type="submit"
                                className={`botao ${acao.principal ? '' : 'botao-secundario'}`}
                                aria-label={`${acao.rotulo} ${u.nome ?? u.email}`}
                              >
                                {acao.rotulo}
                              </button>
                            </form>
                          ))}
                        </div>
                      )}
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
