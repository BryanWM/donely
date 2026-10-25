import { useState, type FormEvent } from 'react';
import { ORIGENS_SUGERIDAS, type Demanda, type PrioridadeDemanda } from '../../shared/dominio';
import type { Acoes } from '../acoes';
import { Modal } from './Modal';

interface Props { demandas: Demanda[]; acoes: Acoes; onFechar: () => void; onCapturada: () => void }

/** Só a descrição é obrigatória. Data e hora entram sozinhas, e capturar não inicia o cronômetro. */
export function CapturaRapida({ demandas, acoes, onFechar, onCapturada }: Props) {
  const [descricao, setDescricao] = useState('');
  const [origem, setOrigem] = useState('');
  const [urgente, setUrgente] = useState(false);
  const [enviando, setEnviando] = useState(false);
  // Sugestões: as de sempre mais as origens já usadas, sem repetir.
  const origens = [...new Set([...ORIGENS_SUGERIDAS, ...demandas.map((d) => d.origem).filter(Boolean)])].slice(0, 6);

  async function salvar(e: FormEvent) {
    e.preventDefault();
    const d = descricao.trim();
    if (!d) { document.getElementById('cr-descricao')?.focus(); return; }
    if (enviando) return;
    setEnviando(true);
    const prioridade: PrioridadeDemanda = urgente ? 'urgente' : 'normal';
    const ok = await acoes.capturar({ descricao: d, origem: origem.trim(), prioridade });
    setEnviando(false);
    if (ok) onCapturada();
  }

  return (
    <Modal titulo="Captura rápida" onFechar={onFechar}
      esquerda={<button type="button" className="btn texto" onClick={onFechar}>Cancelar</button>}
      direita={<button type="submit" form="form-captura" className="btn texto forte" disabled={enviando}>Salvar</button>}>
      <form id="form-captura" className="form-nova" onSubmit={salvar}>
        <div className="lista-ios">
          <label className="sr" htmlFor="cr-descricao">O que pediram</label>
          <textarea id="cr-descricao" className="campo-titulo campo-captura" rows={2} required value={descricao} onChange={(e) => setDescricao(e.target.value)}
            placeholder="O que pediram? Ex.: trocar a foto do post de sexta"
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }} />
        </div>

        <ul className="lista-ios">
          <li className="linha-ios linha-origem">
            <label htmlFor="cr-origem">Quem pediu</label>
            <span className="controle">
              <span className="sugestoes" role="group" aria-label="Sugestões de origem">
                {origens.map((o) => (
                  <button key={o} type="button" className={`sugestao ${origem === o ? 'ativa' : ''}`} aria-pressed={origem === o}
                    onClick={() => setOrigem(origem === o ? '' : o)}>{o}</button>
                ))}
              </span>
              <input id="cr-origem" value={origem} onChange={(e) => setOrigem(e.target.value)} placeholder="Outra pessoa" autoComplete="off"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }} />
            </span>
          </li>
          <li className="linha-ios">
            <span className="rotulo">Prioridade</span>
            <div className="segmentado" role="radiogroup" aria-label="Prioridade">
              <button type="button" role="radio" aria-checked={!urgente} className={!urgente ? 'ativo' : ''} onClick={() => setUrgente(false)}><span className="ponto prioridade-normal" />Normal</button>
              <button type="button" role="radio" aria-checked={urgente} className={urgente ? 'ativo' : ''} onClick={() => setUrgente(true)}><span className="ponto prioridade-urgente" />Urgente</button>
            </div>
          </li>
        </ul>
        <p className="grupo-nota">Enter salva. A data e a hora entram sozinhas, e a demanda fica pendente em Não planejadas, sem iniciar o cronômetro.</p>
      </form>
    </Modal>
  );
}
