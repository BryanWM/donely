import { useEffect, useState } from 'react';
import { NOME_PRIORIDADE_RAPIDA, PRIORIDADES, type Config, type Tarefa } from '../../shared/dominio';
import type { Acoes } from '../acoes';
import { Checklist } from './Checklist';
import { Icone } from './Icone';
import { Modal } from './Modal';

interface Props { tarefa: Tarefa; config: Config; hoje: string; acoes: Acoes; onFechar: () => void }

/** Card rápido aberto: título e descrição à esquerda; propriedades, checklist (no meio da coluna) e excluir à direita. Concluído fica só de leitura, como no Projeto. */
export function ModalTarefaRapida({ tarefa: t, config, hoje, acoes, onFechar }: Props) {
  // título e descrição são salvos ao sair do campo, para não gravar a cada tecla
  const [titulo, setTitulo] = useState(t.titulo);
  const [descricao, setDescricao] = useState(t.notas);
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);
  const leitura = t.status === 'concluido';
  const prazoPassado = Boolean(t.prazo) && t.prazo! < hoje;
  const feitos = t.checklist.filter((i) => i.feito).length;

  useEffect(() => {
    if (!confirmarExclusao) return;
    const espera = setTimeout(() => setConfirmarExclusao(false), 4000);
    return () => clearTimeout(espera);
  }, [confirmarExclusao]);

  function salvarTitulo() {
    const v = titulo.trim();
    if (!v) { setTitulo(t.titulo); return; }
    if (v !== t.titulo) acoes.atualizar(t.id, { titulo: v });
  }

  async function excluir() {
    if (!confirmarExclusao) { setConfirmarExclusao(true); return; }
    onFechar();
    await acoes.excluir(t.id);
  }

  return (
    <Modal grande titulo="Card rápido" onFechar={onFechar} rodape={
      <>
        {t.status === 'a_fazer' && <button type="button" className="btn principal pequeno" onClick={() => acoes.mover(t.id, 'fazendo')}><Icone nome="play" tamanho={14} />Iniciar</button>}
        {t.status === 'fazendo' && <>
          <button type="button" className="btn principal pequeno" onClick={() => acoes.mover(t.id, 'concluido')}><Icone nome="check" tamanho={14} />Concluir</button>
          <button type="button" className="btn texto pequeno" onClick={() => acoes.mover(t.id, 'a_fazer')}>Voltar para A fazer</button>
        </>}
      </>
    }>
      <div className="card">
        <div className="card-fluxo">
          <div className="card-cab">
            <label className="sr" htmlFor="rt-titulo">Título</label>
            <textarea id="rt-titulo" className="card-titulo" rows={1} value={titulo} readOnly={leitura} onChange={(e) => setTitulo(e.target.value)} onBlur={salvarTitulo}
              onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }} />
          </div>

          <section className="passo-corpo">
            <h3 className="passo-titulo">Descrição</h3>
            <label className="sr" htmlFor="rt-descricao">Descrição</label>
            <textarea id="rt-descricao" className="card-briefing" value={descricao} readOnly={leitura} onChange={(e) => setDescricao(e.target.value)}
              onBlur={() => { if (descricao !== t.notas) acoes.atualizar(t.id, { notas: descricao }); }} placeholder={leitura ? '' : 'Do que se trata'} />
          </section>
        </div>

        <aside className="card-lado">
          <ul className="lista-ios props">
            <li className="linha-ios">
              <label htmlFor="rt-tipo">Tipo</label>
              <select id="rt-tipo" value={t.tipo} disabled={leitura} onChange={(e) => acoes.atualizar(t.id, { tipo: e.target.value })}>
                <option value="">Sem tipo</option>
                {/* um tipo que já não está na lista continua aparecendo, para não sumir sem aviso */}
                {t.tipo && !config.tipos.includes(t.tipo) && <option>{t.tipo}</option>}
                {config.tipos.map((x) => <option key={x}>{x}</option>)}
              </select>
            </li>
            <li className="linha-ios">
              <label htmlFor="rt-prazo">Prazo</label>
              <span className="controle">
                <input id="rt-prazo" type="date" value={t.prazo ?? ''} disabled={leitura} aria-invalid={prazoPassado}
                  onChange={(e) => acoes.atualizar(t.id, { prazo: e.target.value || null })} />
                {t.prazo && !leitura && <button type="button" className="btn icone-so" onClick={() => acoes.atualizar(t.id, { prazo: null })} aria-label="Remover prazo"><Icone nome="x" tamanho={14} /></button>}
              </span>
            </li>
            <li className="linha-ios">
              <span className="rotulo">Prioridade</span>
              <div className="segmentado" role="radiogroup" aria-label="Prioridade">
                {PRIORIDADES.map((p) => (
                  <button key={p} type="button" role="radio" aria-checked={t.prioridade === p} className={t.prioridade === p ? 'ativo' : ''} disabled={leitura}
                    onClick={() => acoes.atualizar(t.id, { prioridade: p })}>{NOME_PRIORIDADE_RAPIDA[p]}</button>
                ))}
              </div>
            </li>
          </ul>

          <section className="lado-checklist">
            <h3 className="passo-titulo">Checklist {t.checklist.length > 0 && <span className="contagem">{feitos}/{t.checklist.length}</span>}</h3>
            <Checklist itens={t.checklist} somenteLeitura={leitura}
              onAdicionar={(texto) => acoes.adicionarItem(t.id, texto)}
              onEditar={(item, texto) => acoes.editarItem(t.id, item, texto)}
              onMarcar={(item, feito) => acoes.marcarItem(t.id, item, feito)}
              onRemover={(item) => acoes.removerItem(t.id, item)} />
          </section>

          <div className="lado-rodape">
            <button type="button" className={`excluir ${confirmarExclusao ? 'confirmando' : ''}`} onClick={excluir}>
              {confirmarExclusao ? 'Clique de novo para confirmar a exclusão' : 'Excluir card'}
            </button>
          </div>
        </aside>
      </div>
    </Modal>
  );
}
