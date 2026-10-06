import type { DadosGrafico } from '@/lib/dominio/paineis/tipos'
import { formatarValorGrafico } from '@/lib/dominio/paineis/formatar'

export function TabelaGrafico({ dados }: { dados: DadosGrafico }) {
  return (
    <div className="rolagem-horizontal" style={{ maxHeight: 320, overflowY: 'auto', marginTop: '0.5rem' }}>
      <table className="tabela">
        <caption className="sr-only">{dados.titulo}</caption>
        <thead>
          <tr>
            <th scope="col">Período</th>
            {dados.series.map((s) => (
              <th key={s.chave} scope="col" className="numero">
                {s.nome}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dados.linhas.map((l) => (
            <tr key={l.rotulo}>
              <th scope="row">{l.rotulo}</th>
              {dados.series.map((s) => (
                <td key={s.chave} className="numero">
                  {typeof l[s.chave] === 'number' ? formatarValorGrafico(l[s.chave] as number, dados.unidade) : '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
