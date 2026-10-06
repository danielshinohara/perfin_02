export default function Carregando() {
  return (
    <div role="status" aria-live="polite" className="pilha">
      <p className="rotulo">Carregando indicadores…</p>
      <div className="grade" aria-hidden="true">
        {['a', 'b', 'c', 'd'].map((chave) => (
          <div key={chave} className="cartao" style={{ height: 140, background: 'var(--cor-superficie-2)' }} />
        ))}
      </div>
    </div>
  )
}
