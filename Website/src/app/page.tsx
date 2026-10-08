import type { Metadata } from 'next'
import { INSTITUCIONAL } from '@/conteudo/institucional'
import { linksDeAcesso } from '@/lib/portal'
import { buscarTermometro } from '@/lib/termometro'
import { Cabecalho } from '@/components/Cabecalho'
import { SecaoTermometro } from '@/components/SecaoTermometro'

export const metadata: Metadata = {
  title: 'Perfin · Termômetro da economia',
  description: 'Inflação, juros e câmbio do Brasil em um só lugar, com dados do Banco Central e do IBGE.',
}

export const revalidate = 3600

export default async function PaginaInicial() {
  const termometro = await buscarTermometro()
  const { entrar, criarConta } = linksDeAcesso()
  const { quemSomos, oQueFazemos, contato } = INSTITUCIONAL
  return (
    <>
      <Cabecalho />
      <main id="inicio">
        <section className="secao" aria-labelledby="titulo-principal">
          <div className="conteiner">
            <span className="rotulo">Perfin</span>
            <h1 id="titulo-principal">{INSTITUCIONAL.chamada}</h1>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '2rem' }}>
              <a className="botao" href="#termometro">
                Ver o termômetro da economia
              </a>
              <a className="botao botao-secundario" href={criarConta}>
                Criar conta no portal
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
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <a className="botao" href={entrar}>
                Entrar no portal
              </a>
              <a className="botao botao-secundario" href={criarConta}>
                Criar conta
              </a>
            </div>
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
