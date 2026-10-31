import type { Modelo } from '../../shared/dominio';
import { Icone } from './Icone';
import { Modal } from './Modal';

/** Primeira escolha de "Novo card": Projeto (completo) ou Rápido (mínimo). */
export function EscolhaCard({ onEscolher, onFechar }: { onEscolher: (modelo: Modelo) => void; onFechar: () => void }) {
  return (
    <Modal titulo="Novo card" onFechar={onFechar}>
      <div className="escolha-card">
        <button type="button" onClick={() => onEscolher('projeto')}>
          <Icone nome="ajustes" tamanho={20} /><strong>Projeto</strong>
          <span>Completo: cliente, tipo de entrega, briefing, referências e material produzido.</span>
        </button>
        <button type="button" onClick={() => onEscolher('rapido')}>
          <Icone nome="raio" tamanho={20} /><strong>Rápido</strong>
          <span>Só o essencial: título, descrição, prazo, prioridade e checklist.</span>
        </button>
      </div>
    </Modal>
  );
}
