import { useState, type FormEvent } from 'react';
import { NOME_PRIORIDADE_RAPIDA, PRIORIDADES, type Config, type ItemChecklist, type Prioridade } from '../../shared/dominio';
import type { Acoes } from '../acoes';
import { Checklist } from './Checklist';
import { Icone } from './Icone';
import { Modal } from './Modal';

interface Props { hoje: string; config: Config; acoes: Acoes; onFechar: () => void; onCriada: () => void }

/** Card rápido: título obrigatório; descrição, prazo, prioridade e checklist são opcionais. */
export function ModalNovaRapida({ hoje, config, acoes, onFechar, onCriada }: Props) {
  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [prazo, setPrazo] = useState('');
  const [prioridade, setPrioridade] = useState<Prioridade>('normal');
  // o checklist fica aqui até o card existir; os itens viram do servidor ao criar
  const [itens, setItens] = useState<ItemChecklist[]>([]);
  const [tentou, setTentou] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const semTitulo = !titulo.trim();
  const prazoPassado = Boolean(prazo) && prazo < hoje;

  async function criar(e: FormEvent) {
    e.preventDefault();
    setTentou(true);
    if (semTitulo || prazoPassado) { document.getElementById(semTitulo ? 'rp-titulo' : 'rp-prazo')?.focus(); return; }
    if (enviando) return;
    setEnviando(true);
    const t = await acoes.criar({ modelo: 'rapido', titulo: titulo.trim(), notas: descricao.trim(), tipo, prazo: prazo || null, prioridade, checklist: itens.map((i) => i.texto) });
    // os itens nascem desmarcados: marca os que já estavam feitos, na mesma ordem
    if (t) for (const [i, item] of itens.entries()) if (item.feito && t.checklist[i]) await acoes.marcarItem(t.id, t.checklist[i].id, true);
    setEnviando(false);
    if (t) onCriada();
  }

  const mudarItens = (fn: (lista: ItemChecklist[]) => ItemChecklist[]) => setItens((lista) => fn(lista));

  return (
    <Modal titulo="Novo card rápido" onFechar={onFechar} rodape={
      <>
        {tentou && (semTitulo || prazoPassado) && <p className="rodape-erro" role="alert">{semTitulo ? 'Dê um título para o card.' : 'Escolha um prazo de hoje em diante.'}</p>}
        <button type="button" className="btn" onClick={onFechar}>Cancelar</button>
        <button type="submit" form="form-rapida" className="btn principal" disabled={enviando}>{enviando ? 'Criando…' : 'Criar card'}</button>
      </>
    }>
      <form id="form-rapida" className="form-nova" onSubmit={criar} noValidate>
        <div className="lista-ios">
          <label className="sr" htmlFor="rp-titulo">Título</label>
          <textarea id="rp-titulo" className="campo-titulo" rows={1} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título do card"
            onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }} aria-invalid={tentou && semTitulo} />
        </div>

        <section className="grupo-ios">
          <h3 className="grupo-titulo">Descrição <span className="opcional">opcional</span></h3>
          <div className="lista-ios">
            <label className="sr" htmlFor="rp-descricao">Descrição</label>
            <textarea id="rp-descricao" className="campo-notas" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Do que se trata" />
          </div>
        </section>

        <section className="grupo-ios">
          <ul className="lista-ios">
            <li className="linha-ios">
              <label htmlFor="rp-tipo">Tipo <span className="opcional">opcional</span></label>
              <select id="rp-tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                <option value="">Sem tipo</option>
                {config.tipos.map((x) => <option key={x}>{x}</option>)}
              </select>
            </li>
            <li className="linha-ios">
              <label htmlFor="rp-prazo">Prazo <span className="opcional">opcional</span></label>
              <span className="controle">
                <input id="rp-prazo" type="date" min={hoje} value={prazo} onChange={(e) => setPrazo(e.target.value)} aria-invalid={tentou && prazoPassado} />
                {prazo && <button type="button" className="btn icone-so" onClick={() => setPrazo('')} aria-label="Remover prazo"><Icone nome="x" tamanho={14} /></button>}
              </span>
            </li>
            <li className="linha-ios">
              <span className="rotulo">Prioridade</span>
              <div className="segmentado" role="radiogroup" aria-label="Prioridade">
                {PRIORIDADES.map((p) => (
                  <button key={p} type="button" role="radio" aria-checked={prioridade === p} className={prioridade === p ? 'ativo' : ''} onClick={() => setPrioridade(p)}>
                    {NOME_PRIORIDADE_RAPIDA[p]}
                  </button>
                ))}
              </div>
            </li>
          </ul>
        </section>

        <section className="grupo-ios">
          <h3 className="grupo-titulo">Checklist <span className="opcional">opcional</span></h3>
          <Checklist itens={itens}
            onAdicionar={(texto) => mudarItens((l) => [...l, { id: `novo-${l.length}-${texto}`, texto, feito: false }])}
            onEditar={(id, texto) => mudarItens((l) => l.map((i) => (i.id === id ? { ...i, texto } : i)))}
            onMarcar={(id, feito) => mudarItens((l) => l.map((i) => (i.id === id ? { ...i, feito } : i)))}
            onRemover={(id) => mudarItens((l) => l.filter((i) => i.id !== id))} />
        </section>
      </form>
    </Modal>
  );
}
