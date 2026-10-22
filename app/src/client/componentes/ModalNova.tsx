import { useState } from 'react';
import { NOME_PRIORIDADE, PRIORIDADES, type Cliente, type Config, type Prioridade } from '../../shared/dominio';
import type { Acoes } from '../acoes';
import { Modal } from './Modal';

interface Props { config: Config; clientes: Cliente[]; acoes: Acoes; onFechar: () => void; onCriada: (id: string) => void }

export function ModalNova({ config, clientes, acoes, onFechar, onCriada }: Props) {
  const [f, setF] = useState({ titulo: '', cliente: '', tipo: '', prioridade: 'normal' as Prioridade, prazo: '', notas: '', checklist: '' });
  const [enviando, setEnviando] = useState(false);
  const mudar = (campo: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [campo]: e.target.value });

  async function criar() {
    if (!f.titulo.trim() || enviando) return;
    setEnviando(true);
    const t = await acoes.criar({
      titulo: f.titulo.trim(), cliente: f.cliente.trim(), tipo: f.tipo, prioridade: f.prioridade,
      prazo: f.prazo || null, notas: f.notas.trim(),
      checklist: f.checklist.split('\n').map((s) => s.trim()).filter(Boolean),
    });
    setEnviando(false);
    if (t) onCriada(t.id);
  }

  return (
    <Modal titulo="Nova tarefa" onFechar={onFechar}
      esquerda={<button type="button" className="btn texto" onClick={onFechar}>Cancelar</button>}
      direita={<button type="button" className="btn texto forte" onClick={criar} disabled={!f.titulo.trim() || enviando}>Adicionar</button>}>
      <form onSubmit={(e) => { e.preventDefault(); criar(); }} style={{ display: 'contents' }}>
        <div className="lista-ios">
          <label className="sr" htmlFor="nv-titulo">Título</label>
          <input id="nv-titulo" className="campo-titulo" value={f.titulo} onChange={mudar('titulo')} placeholder="Título" />
          <label className="sr" htmlFor="nv-notas">Notas</label>
          <textarea id="nv-notas" className="campo-notas" value={f.notas} onChange={mudar('notas')} placeholder="Notas: briefing, referências, o que não pode faltar…" />
        </div>

        <ul className="lista-ios">
          <li className="linha-ios">
            <label htmlFor="nv-cliente">Cliente</label>
            <input id="nv-cliente" list="nv-clientes" value={f.cliente} onChange={mudar('cliente')} placeholder="Escolha ou digite" />
            <datalist id="nv-clientes">{clientes.map((c) => <option key={c.id} value={c.nome} />)}</datalist>
          </li>
          <li className="linha-ios">
            <label htmlFor="nv-tipo">Tipo</label>
            <select id="nv-tipo" value={f.tipo} onChange={mudar('tipo')}>
              <option value="">Sem tipo</option>{config.tipos.map((x) => <option key={x}>{x}</option>)}
            </select>
          </li>
          <li className="linha-ios">
            <span className="rotulo">Prioridade</span>
            <div className="segmentado" role="radiogroup" aria-label="Prioridade">
              {PRIORIDADES.map((p) => (
                <button key={p} type="button" role="radio" aria-checked={f.prioridade === p} className={f.prioridade === p ? 'ativo' : ''}
                  onClick={() => setF({ ...f, prioridade: p })}><span className={`ponto prioridade-${p}`} />{NOME_PRIORIDADE[p]}</button>
              ))}
            </div>
          </li>
          <li className="linha-ios">
            <label htmlFor="nv-prazo">Prazo</label>
            <input id="nv-prazo" type="date" value={f.prazo} onChange={mudar('prazo')} />
          </li>
        </ul>

        <section className="grupo-ios">
          <h3 className="grupo-titulo">Checklist</h3>
          <div className="lista-ios">
            <label className="sr" htmlFor="nv-checklist">Checklist</label>
            <textarea id="nv-checklist" className="campo-notas" style={{ minHeight: 96, paddingTop: 12 }} value={f.checklist} onChange={mudar('checklist')} placeholder={'Capa\nTelas internas\nRevisão'} />
          </div>
          <p className="grupo-nota">Um item por linha. A tarefa entra em "A fazer".</p>
        </section>
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
