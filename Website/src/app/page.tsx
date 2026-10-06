import type { Metadata } from 'next'
import { INSTITUCIONAL } from '@/conteudo/institucional'
import { buscarTermometro, urlDoPortal } from '@/lib/termometro'
import { SecaoTermometro } from '@/components/SecaoTermometro'

export const metadata: Metadata = {
  title: 'Perfin · Termômetro da economia',
  description: 'Inflação, juros e câmbio do Brasil em um só lugar, com dados do Banco Central e do IBGE.',
}

export const revalidate = 3600

export default async function PaginaInicial() {
  const termometro = await buscarTermometro()
  const portal = urlDoPortal('/')
  const { quemSomos, oQueFazemos, contato } = INSTITUCIONAL
  return (
    <>
      <header className="conteiner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBlock: '1.25rem', gap: '1rem' }}>
        <strong style={{ color: 'var(--cor-texto)', fontSize: '1.25rem' }}>{INSTITUCIONAL.titulo}</strong>
        <a className="botao" href={portal}>
          Entrar no portal
        </a>
      </header>
      <main>
        <section className="secao" aria-labelledby="titulo-principal">
          <div className="conteiner">
            <span className="rotulo">Perfin</span>
            <h1 id="titulo-principal">{INSTITUCIONAL.chamada}</h1>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '2rem' }}>
              <a className="botao" href="#termometro">
                Ver o termômetro da economia
              </a>
              <a className="botao botao-secundario" href={portal}>
                Instale o app do portal
              </a>
            </div>
          </div>
        </section>
        <section className="secao secao-alternada" aria-labelledby="titulo-quem-somos">
          <div className="conteiner">
            <h2 id="titulo-quem-somos">{quemSomos.titulo}</h2>
            <p className={quemSomos.provisorio ? 'provisorio' : undefined}>{quemSomos.texto}</p>
            <h2 style={{ marginTop: '3rem' }}>{oQueFazemos.titulo}</h2>
            <ul className={`grade ${oQueFazemos.provisorio ? 'provisorio' : ''}`} style={{ listStyle: 'none', padding: '1rem', margin: 0 }}>
              {oQueFazemos.itens.map((item) => (
                <li key={item} className="cartao">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>
        <SecaoTermometro termometro={termometro} />
        <section className="secao secao-alternada" aria-labelledby="titulo-portal">
          <div className="conteiner">
            <h2 id="titulo-portal">Portal Perfin</h2>
            <p>
              Painéis completos, insights automáticos, relatório mensal e assistente para a equipe. Instale o portal no celular ou no
              computador direto pelo navegador: no Android e no Chrome, use “Instalar app”; no iPhone, toque em Compartilhar e “Adicionar à
              Tela de Início”.
            </p>
            <a className="botao" href={portal}>
              Entrar no portal
            </a>
          </div>
        </section>
      </main>
      <footer className="secao" style={{ paddingBlock: '3rem' }}>
        <div className="conteiner">
          <h2 style={{ fontSize: '1.25rem' }}>{contato.titulo}</h2>
          <p className={contato.provisorio ? 'provisorio' : undefined}>{contato.texto}</p>
          <p style={{ fontSize: '0.8125rem' }}>
            Dados do Banco Central do Brasil e do IBGE, apenas informativos. Não constituem recomendação de investimento.
          </p>
        </div>
      </footer>
    </>
  )
}
