import { useState } from 'react';
import { definirDicaDiaria, dicaDiariaLigada, PROMPTS_IA, type PromptIA } from '../dicas';

/** Aba Dicas das Configurações: os três prompts para uma IA gratuita, com o jeito de pedir em cada chat. */
export function DicasIA() {
  const [copiado, setCopiado] = useState('');
  const [erro, setErro] = useState('');
  const [ligada, setLigada] = useState(dicaDiariaLigada);

  async function copiar(p: PromptIA) {
    try { await navigator.clipboard.writeText(p.prompt); setCopiado(p.id); setErro(''); }
    catch { setErro('O navegador não deixou copiar agora. Tente de novo.'); }
  }

  function escolherDica(valor: boolean) {
    definirDicaDiaria(valor);
    setLigada(valor);
  }

  return (
    <>
      <section className="grupo-ios">
        <ul className="lista-ios">
          <li className="linha-ios">
            <span className="rotulo">Mostrar a dica do dia ao abrir o app</span>
            <div className="segmentado" role="radiogroup" aria-label="Mostrar a dica do dia">
              <button type="button" role="radio" aria-checked={ligada} className={ligada ? 'ativo' : ''} onClick={() => escolherDica(true)}>Mostrar</button>
              <button type="button" role="radio" aria-checked={!ligada} className={!ligada ? 'ativo' : ''} onClick={() => escolherDica(false)}>Não mostrar</button>
            </div>
          </li>
        </ul>
      </section>

      <section className="dicas-grade">
        {PROMPTS_IA.map((p) => (
          <article key={p.id} className="dica-ia">
            <header className="dica-cab">
              <h3>{p.titulo}</h3>
              <span className="grupo-nota">{p.destino}</span>
            </header>
            <ul className="dica-pedidos">
              {p.pedidos.map((x) => <li key={x}><code>{x}</code></li>)}
            </ul>
            <button type="button" className="btn texto pequeno" onClick={() => copiar(p)}>
              {copiado === p.id ? 'Copiado' : 'Copiar prompt'}
            </button>
          </article>
        ))}
      </section>
      <p className={`grupo-nota ${erro ? 'erro-campo' : ''}`} role="status">{erro}</p>

      <section className="grupo-ios">
        <h3 className="grupo-titulo">Se o chat bloquear</h3>
        <p className="grupo-nota">
          Os apps gratuitos bloqueiam o chat quando você excede o limite. Crie outro chat, no mesmo tipo, e cole o prompt de novo.
          Se você estava no meio de uma organização, cole em seguida a última versão gerada e peça o ajuste que falta.
          A versão que não foi copiada antes do bloqueio fica no chat bloqueado.
        </p>
      </section>
    </>
  );
}
