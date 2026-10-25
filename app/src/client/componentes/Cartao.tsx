import { useRef, useState } from 'react';
import { diasParaArquivar, NOME_PRIORIDADE, situacaoPrazo, type Tarefa } from '../../shared/dominio';
import { Icone } from './Icone';
import { prepararVoo } from '../voo';

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
  onIniciar: () => Promise<void>;
  onConcluir: () => Promise<void>;
  onArquivar: () => Promise<void>;
}

/** Uma tarefa como linha da lista. As colunas seguem o cabeçalho em Quadro (.lista-cab). */
export function Cartao({ tarefa: t, hoje, arquivarAposDias, onAbrir, onIniciar, onConcluir, onArquivar }: Props) {
  const [ocupado, setOcupado] = useState(false);
  const linha = useRef<HTMLElement>(null);
  // Uma ação por vez: o botão trava até a resposta (clique duplo não move nem conclui duas vezes).
  // Com destino, a linha "viaja" até a aba, mas só depois que a ação deu certo (a linha saiu da lista):
  // uma ação lenta ou com erro não comemora antes da hora.
  const agir = (fn: () => Promise<void>, destino?: string) => async () => {
    if (ocupado) return;
    setOcupado(true);
    const el = linha.current, lancar = destino ? prepararVoo(el, `aba-${destino}`) : undefined;
    try { await fn(); } finally { setOcupado(false); }
    // dois quadros: tempo para o React tirar a linha da lista antes de conferir
    requestAnimationFrame(() => requestAnimationFrame(() => lancar?.(!el?.isConnected)));
  };
  const feitos = t.checklist.filter((i) => i.feito).length;
  const concluida = t.status === 'concluido';
  const faltam = concluida ? diasParaArquivar(t, arquivarAposDias, hoje) : 0;
  const vazio = <span className="sem-valor">—</span>;
  // A faixa à esquerda marca o que pede atenção: atraso vale mais que prioridade.
  const destaque = concluida ? 'cartao-feito' : situacaoPrazo(t, hoje)?.tipo === 'atrasada' ? 'cartao-atrasada' : `cartao-${t.prioridade}`;

  return (
    <article ref={linha} className={`cartao ${destaque}`}>
      <button type="button" className="cartao-abrir" onClick={onAbrir} aria-label={`Abrir ${t.titulo}`} />
      <span className="cel"><h3 title={t.titulo}>{t.titulo}</h3></span>
      <span className="cel">{t.cliente ? <span className="texto-corte" title={t.cliente}>{t.cliente}</span> : vazio}</span>
      <span className="cel">{t.tipo ? <span className="chip">{t.tipo}</span> : vazio}</span>
      <span className="cel"><Prioridade valor={t.prioridade} /></span>
      <span className="cel">{concluida ? <span className="data-prazo">{faltam === 1 ? 'Amanhã' : `Em ${faltam} dias`}</span> : (situacaoPrazo(t, hoje) ? <SeloPrazo tarefa={t} hoje={hoje} /> : vazio)}</span>
      <span className="cel cel-itens">
        {t.checklist.length > 0 && <span><Icone nome="lista" tamanho={14} />{feitos}/{t.checklist.length}</span>}
        {t.links.length > 0 && <span><Icone nome="link" tamanho={14} />{t.links.length}</span>}
        {!t.checklist.length && !t.links.length && vazio}
      </span>
      <span className="cel cel-acoes">
        {concluida && <button type="button" className="btn pequeno contorno cartao-acao" disabled={ocupado} onClick={agir(onArquivar, 'historico')} aria-label={`Arquivar ${t.titulo} agora`}><Icone nome="arquivo" tamanho={13} />Arquivar</button>}
        {t.status === 'a_fazer' && <button type="button" className="btn pequeno contorno cartao-acao" disabled={ocupado} onClick={agir(onIniciar, 'fazendo')} aria-label={`Iniciar ${t.titulo}`}><Icone nome="play" tamanho={13} />Iniciar</button>}
        {t.status === 'fazendo' && (
          <button type="button" className="btn pequeno contorno cartao-acao" disabled={ocupado} aria-label={`Concluir ${t.titulo}`} onClick={agir(onConcluir, 'concluido')}>
            <Icone nome="check" tamanho={13} />{ocupado ? 'Concluindo…' : 'Concluir'}
          </button>
        )}
      </span>
    </article>
  );
}
