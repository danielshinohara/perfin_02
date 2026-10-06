import type { Metadata } from 'next'
import { exigirAdmin } from '@/lib/auth/sessao'
import { formatarDataHora } from '@/lib/dominio/formatos'
import { listarUsuarios } from '@/lib/servicos/admin'
import { criarClienteServidor } from '@/lib/supabase/servidor'
import { CabecalhoPagina } from '@/components/paineis/CabecalhoPagina'
import { alternarBloqueio } from './acoes'

export const metadata: Metadata = { title: 'Usuários', description: 'Liberar ou bloquear o acesso ao portal.' }

export default async function PaginaUsuarios() {
  const sessao = await exigirAdmin()
  const usuarios = await listarUsuarios(await criarClienteServidor())
  return (
    <>
      <CabecalhoPagina
        titulo="Usuários"
        descricao="Quem já entrou no portal. Usuários bloqueados veem “Acesso não autorizado”. Quem pode fazer login com Google é definido no Google Cloud."
      />
      <section className="cartao">
        {usuarios.length === 0 ? (
          <p className="aviso aviso-info">Nenhum usuário entrou no portal ainda.</p>
        ) : (
          <div className="rolagem-horizontal">
            <table className="tabela">
              <thead>
                <tr>
                  <th scope="col">Usuário</th>
                  <th scope="col">Situação</th>
                  <th scope="col">Último acesso</th>
                  <th scope="col">Ação</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.userId}>
                    <th scope="row">
                      {u.nome ?? u.email}
                      {u.nome && <span style={{ display: 'block', fontWeight: 400 }}>{u.email}</span>}
                    </th>
                    <td className={u.bloqueado ? 'negativo' : 'positivo'}>{u.bloqueado ? '▲ Bloqueado' : '● Ativo'}</td>
                    <td>{u.ultimoAcessoEm ? formatarDataHora(u.ultimoAcessoEm) : 'Nunca'}</td>
                    <td>
                      {u.userId === sessao.userId ? (
                        <span>Você</span>
                      ) : (
                        <form action={alternarBloqueio}>
                          <input type="hidden" name="userId" value={u.userId} />
                          <input type="hidden" name="bloquear" value={u.bloqueado ? 'nao' : 'sim'} />
                          <button type="submit" className="botao botao-secundario">
                            {u.bloqueado ? 'Desbloquear' : 'Bloquear'}
                          </button>
                        </form>
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
