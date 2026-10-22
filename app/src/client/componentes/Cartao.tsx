import { diasParaArquivar, NOME_PRIORIDADE, situacaoPrazo, type Tarefa } from '../../shared/dominio';
import { Icone } from './Icone';

export function SeloPrazo({ tarefa, hoje }: { tarefa: Tarefa; hoje: string }) {
  const s = situacaoPrazo(tarefa, hoje);
  if (!s) return null;
  if (s.tipo === 'atrasada') return <span className="selo selo-erro">Atrasada · {s.dias} {s.dias === 1 ? 'dia' : 'dias'}</span>;
  if (s.tipo === 'hoje') return <span className="selo selo-atencao">Vence hoje</span>;
  const [, m, d] = tarefa.prazo!.split('-');
  // Só o que pede atenção vira selo; data futura é texto simples.
  return <span className="data-prazo">{s.dias === 1 ? 'Amanhã' : `${d}/${m}`}</span>;
}

export function Prioridade({ valor }: { valor: Tarefa['prioridade'] }) {
  if (valor === 'normal') return <span className="sem-valor">Normal</span>;
  return <span className={`prioridade prioridade-${valor}`}><span className="ponto" />{NOME_PRIORIDADE[valor]}</span>;
}

interface Props {
  tarefa: Tarefa;
  hoje: string;
  arquivarAposDias: number;
  onAbrir: () => void;
  onMenu: (x: number, y: number) => void;
}

/** Uma tarefa como linha da lista. As colunas seguem o cabeçalho em Quadro (.lista-cab). */
export function Cartao({ tarefa: t, hoje, arquivarAposDias, onAbrir, onMenu }: Props) {
  const feitos = t.checklist.filter((i) => i.feito).length;
  const concluida = t.status === 'concluido';
  const faltam = concluida ? diasParaArquivar(t, arquivarAposDias, hoje) : 0;
  const vazio = <span className="sem-valor">—</span>;

  return (
    <article className={`cartao ${concluida ? 'cartao-feito' : ''}`} draggable
      onDragStart={(e) => { e.dataTransfer.setData('text/plain', t.id); e.dataTransfer.effectAllowed = 'move'; }}>
      <button type="button" className="cartao-abrir" onClick={onAbrir} aria-label={`Abrir ${t.titulo}`} />
      <span className="cel"><h3>{t.titulo}</h3>{t.origem === 'notion' && <span className="origem">Notion</span>}</span>
      <span className="cel">{t.cliente || vazio}</span>
      <span className="cel">{t.tipo ? <span className="chip">{t.tipo}</span> : vazio}</span>
      <span className="cel"><Prioridade valor={t.prioridade} /></span>
      <span className="cel">{concluida ? <span className="data-prazo">{faltam === 1 ? 'Amanhã' : `Em ${faltam} dias`}</span> : (situacaoPrazo(t, hoje) ? <SeloPrazo tarefa={t} hoje={hoje} /> : vazio)}</span>
      <span className="cel cel-itens">
        {t.checklist.length > 0 && <span><Icone nome="lista" tamanho={14} />{feitos}/{t.checklist.length}</span>}
        {t.links.length > 0 && <span><Icone nome="link" tamanho={14} />{t.links.length}</span>}
        {!t.checklist.length && !t.links.length && vazio}
      </span>
      <button type="button" className="btn icone-so cartao-mover" aria-label="Mover tarefa"
        onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); onMenu(r.right, r.bottom); }}>
        <Icone nome="mais_opcoes" />
      </button>
    </article>
  );
}
