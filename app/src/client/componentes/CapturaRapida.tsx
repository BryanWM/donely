import { useState, type FormEvent } from 'react';
import { ORIGENS_SUGERIDAS, type Demanda, type PrioridadeDemanda } from '../../shared/dominio';
import type { Acoes } from '../acoes';
import { Icone } from './Icone';
import { Modal } from './Modal';

interface Props { demandas: Demanda[]; ocultas: string[]; acoes: Acoes; onFechar: () => void; onCapturada: () => void }

/** Só a descrição é obrigatória. Data e hora entram sozinhas, e capturar não inicia o cronômetro. */
export function CapturaRapida({ demandas, ocultas, acoes, onFechar, onCapturada }: Props) {
  const [descricao, setDescricao] = useState('');
  const [origem, setOrigem] = useState('');
  const [urgente, setUrgente] = useState(false);
  const [enviando, setEnviando] = useState(false);
  // Sugestões: as de sempre mais as origens já usadas, sem repetir.
  // Sugestões: as de sempre mais as origens já usadas, sem repetir e sem as que a pessoa tirou.
  const origens = [...new Set([...ORIGENS_SUGERIDAS, ...demandas.map((d) => d.origem).filter(Boolean)])].filter((o) => !ocultas.includes(o)).slice(0, 6);

  // Tirar uma sugestão só a esconde daqui: as demandas registradas com esse nome continuam iguais.
  function removerSugestao(o: string) {
    if (origem === o) setOrigem('');
    acoes.salvarConfig({ origensOcultas: [...ocultas, o] });
  }

  async function salvar(e: FormEvent) {
    e.preventDefault();
    const d = descricao.trim();
    if (!d) { document.getElementById('cr-descricao')?.focus(); return; }
    if (enviando) return;
    setEnviando(true);
    const prioridade: PrioridadeDemanda = urgente ? 'urgente' : 'normal';
    const quem = origem.trim();
    const ok = await acoes.capturar({ descricao: d, origem: quem, prioridade });
    // Usar de novo um nome tirado o traz de volta às sugestões.
    if (ok && ocultas.includes(quem)) acoes.salvarConfig({ origensOcultas: ocultas.filter((o) => o !== quem) });
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
                  <span key={o} className={`sugestao ${origem === o ? 'ativa' : ''}`}>
                    <button type="button" aria-pressed={origem === o} onClick={() => setOrigem(origem === o ? '' : o)}>{o}</button>
                    <button type="button" className="sugestao-remover" aria-label={`Tirar ${o} das sugestões`} title="Tirar das sugestões" onClick={() => removerSugestao(o)}>
                      <Icone nome="x" tamanho={12} />
                    </button>
                  </span>
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
