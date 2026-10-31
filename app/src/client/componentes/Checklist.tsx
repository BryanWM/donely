import { useState, type KeyboardEvent } from 'react';
import type { ItemChecklist } from '../../shared/dominio';
import { Icone } from './Icone';

interface Props {
  itens: ItemChecklist[];
  somenteLeitura?: boolean;
  onAdicionar: (texto: string) => void | Promise<void>;
  onEditar: (id: string, texto: string) => void | Promise<void>;
  onMarcar: (id: string, feito: boolean) => void | Promise<void>;
  onRemover: (id: string) => void | Promise<void>;
}

/** Checklist de um card: adicionar, editar o texto, marcar, desmarcar e remover. */
export function Checklist({ itens, somenteLeitura, onAdicionar, onEditar, onMarcar, onRemover }: Props) {
  const [novo, setNovo] = useState('');
  const feitos = itens.filter((i) => i.feito).length;

  // Não é um <form>: dentro do formulário do card, o Enter daqui subiria até o envio do card.
  async function adicionar(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const texto = novo.trim();
    if (!texto) return;
    setNovo('');
    await onAdicionar(texto);
  }

  return (
    <div className="checklist">
      {itens.length > 0 && (
        <p className="checklist-progresso"><span>{feitos} de {itens.length} feitos</span>
          <span className="checklist-barra" aria-hidden="true"><span style={{ width: `${(feitos / itens.length) * 100}%` }} /></span>
        </p>
      )}
      <ul className="checklist-itens">
        {itens.map((i) => (
          <li key={i.id} className={`checklist-item ${i.feito ? 'feito' : ''}`}>
            <input type="checkbox" checked={i.feito} disabled={somenteLeitura} onChange={(e) => onMarcar(i.id, e.target.checked)} aria-label={`Feito: ${i.texto}`} />
            {/* o texto é salvo ao sair do campo ou com Enter; vazio volta ao que era */}
            <input className="checklist-texto" aria-label="Texto do item" defaultValue={i.texto} key={i.texto} readOnly={somenteLeitura}
              onBlur={(e) => { const v = e.target.value.trim(); if (!v) e.target.value = i.texto; else if (v !== i.texto) onEditar(i.id, v); }}
              onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }} />
            {!somenteLeitura && <button type="button" className="btn icone-so" onClick={() => onRemover(i.id)} aria-label={`Remover ${i.texto}`}><Icone nome="x" tamanho={14} /></button>}
          </li>
        ))}
      </ul>
      {!somenteLeitura && (
        <div className="checklist-novo">
          <Icone nome="mais" tamanho={14} />
          <input aria-label="Novo item do checklist" value={novo} onChange={(e) => setNovo(e.target.value)} onKeyDown={adicionar} placeholder="Adicionar item e Enter" />
        </div>
      )}
    </div>
  );
}
