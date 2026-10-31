import { useState } from 'react';
import { NOME_PRIORIDADE_RAPIDA, PRIORIDADES, type Config, type Tarefa } from '../../shared/dominio';
import type { Acoes } from '../acoes';
import { Checklist } from './Checklist';
import { Icone } from './Icone';
import { Modal } from './Modal';

interface Props { tarefa: Tarefa; config: Config; hoje: string; acoes: Acoes; onFechar: () => void }

/** Card rápido aberto: só os cinco campos. Concluído fica só de leitura, como no Projeto. */
export function ModalTarefaRapida({ tarefa: t, config, hoje, acoes, onFechar }: Props) {
  // título e descrição são salvos ao sair do campo, para não gravar a cada tecla
  const [titulo, setTitulo] = useState(t.titulo);
  const [descricao, setDescricao] = useState(t.notas);
  const leitura = t.status === 'concluido';
  const prazoPassado = Boolean(t.prazo) && t.prazo! < hoje;

  function salvarTitulo() {
    const v = titulo.trim();
    if (!v) { setTitulo(t.titulo); return; }
    if (v !== t.titulo) acoes.atualizar(t.id, { titulo: v });
  }

  return (
    <Modal titulo="Card rápido" onFechar={onFechar} rodape={
      <>
        {t.status === 'a_fazer' && <button type="button" className="btn principal pequeno" onClick={() => acoes.mover(t.id, 'fazendo')}><Icone nome="play" tamanho={14} />Iniciar</button>}
        {t.status === 'fazendo' && <>
          <button type="button" className="btn principal pequeno" onClick={() => acoes.mover(t.id, 'concluido')}><Icone nome="check" tamanho={14} />Concluir</button>
          <button type="button" className="btn texto pequeno" onClick={() => acoes.mover(t.id, 'a_fazer')}>Voltar para A fazer</button>
        </>}
      </>
    }>
      <div className="form-nova">
        <div className="lista-ios">
          <label className="sr" htmlFor="rt-titulo">Título</label>
          <textarea id="rt-titulo" className="campo-titulo" rows={1} value={titulo} readOnly={leitura} onChange={(e) => setTitulo(e.target.value)} onBlur={salvarTitulo}
            onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }} />
        </div>

        <section className="grupo-ios">
          <h3 className="grupo-titulo">Descrição</h3>
          <div className="lista-ios">
            <label className="sr" htmlFor="rt-descricao">Descrição</label>
            <textarea id="rt-descricao" className="campo-notas" value={descricao} readOnly={leitura} onChange={(e) => setDescricao(e.target.value)}
              onBlur={() => { if (descricao !== t.notas) acoes.atualizar(t.id, { notas: descricao }); }} placeholder={leitura ? '' : 'Do que se trata'} />
          </div>
        </section>

        <section className="grupo-ios">
          <ul className="lista-ios">
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
        </section>

        <section className="grupo-ios">
          <h3 className="grupo-titulo">Checklist</h3>
          <Checklist itens={t.checklist} somenteLeitura={leitura}
            onAdicionar={(texto) => acoes.adicionarItem(t.id, texto)}
            onEditar={(item, texto) => acoes.editarItem(t.id, item, texto)}
            onMarcar={(item, feito) => acoes.marcarItem(t.id, item, feito)}
            onRemover={(item) => acoes.removerItem(t.id, item)} />
        </section>
      </div>
    </Modal>
  );
}
