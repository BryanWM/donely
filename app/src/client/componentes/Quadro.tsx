import { useState } from 'react';
import { COLUNAS, estaArquivada, ordenarTarefas, type Config, type Status, type Tarefa } from '../../shared/dominio';
import type { Acoes } from '../acoes';
import { Cartao } from './Cartao';
import { Icone } from './Icone';

interface Props {
  /** A pasta aberta: só os cards desta coluna aparecem. */
  coluna: Status;
  tarefas: Tarefa[];
  config: Config;
  hoje: string;
  acoes: Acoes;
  onAbrir: (id: string) => void;
  onConfig: () => void;
  onNova: () => void;
}

export function Quadro({ coluna, tarefas, config, hoje, acoes, onAbrir, onConfig, onNova }: Props) {
  const [busca, setBusca] = useState('');
  const [cliente, setCliente] = useState('');
  const [tipo, setTipo] = useState('');

  const noQuadro = tarefas.filter((t) => !estaArquivada(t, config.arquivarAposDias, hoje));
  const q = busca.trim().toLowerCase();
  const visiveis = noQuadro.filter((t) => (!cliente || t.cliente === cliente) && (!tipo || t.tipo === tipo)
    && (!q || [t.titulo, t.cliente, t.notas].some((x) => x.toLowerCase().includes(q))));
  const clientes = [...new Set(noQuadro.map((t) => t.cliente).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const tipos = [...new Set([...config.tipos, ...noQuadro.map((t) => t.tipo).filter(Boolean)])];

  const daColuna = visiveis.filter((t) => t.status === coluna);
  const lista = coluna === 'concluido' ? daColuna.sort((a, b) => (b.concluidoEm ?? '').localeCompare(a.concluidoEm ?? '')) : ordenarTarefas(daColuna, hoje);

  const filtrando = Boolean(q || cliente || tipo);
  const limparFiltros = () => { setBusca(''); setCliente(''); setTipo(''); };

  return (
    <>
      <div className="barra-filtros">
        <label>Buscar
          <span className="busca"><Icone nome="busca" /><input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Título, cliente ou nota" /></span>
        </label>
        <label>Cliente
          <select value={cliente} onChange={(e) => setCliente(e.target.value)}>
            <option value="">Todos</option>{clientes.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label>Tipo
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="">Todos</option>{tipos.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <button type="button" className="btn principal" onClick={onNova}><Icone nome="mais" />Nova tarefa</button>
      </div>

      {coluna === 'concluido' && (
        <p className="nota-coluna"><Icone nome="arquivo" tamanho={14} />
          Vão para o Histórico {config.arquivarAposDias === 1 ? 'no dia seguinte' : `após ${config.arquivarAposDias} dias`} · <button type="button" onClick={onConfig}>Mudar o prazo</button></p>
      )}

      <div className="lista-cartoes">
        <div className="lista-cab" aria-hidden="true">
          <span>Tarefa</span><span>Cliente</span><span>Tipo</span><span>Prioridade</span><span>{coluna === 'concluido' ? 'Vai para o histórico' : 'Prazo'}</span><span>Itens</span><span />
        </div>
        {lista.length
          ? lista.map((t) => <Cartao key={t.id} tarefa={t} hoje={hoje} arquivarAposDias={config.arquivarAposDias}
              onAbrir={() => onAbrir(t.id)}
              onIniciar={() => acoes.mover(t.id, 'fazendo')} onConcluir={() => acoes.mover(t.id, 'concluido')} onArquivar={() => acoes.arquivar(t.id)} />)
          : filtrando && daColuna.length < noQuadro.filter((t) => t.status === coluna).length ? (
            <div className="vazio">
              <p>Nenhuma tarefa em {COLUNAS.find((c) => c.id === coluna)!.nome} com esses filtros.</p>
              <button type="button" className="btn texto pequeno" onClick={limparFiltros}>Limpar filtros</button>
            </div>
          ) : coluna === 'a_fazer' ? (
            <div className="vazio">
              <p>{noQuadro.length ? 'Nada a fazer por aqui.' : 'Comece pela sua primeira tarefa.'}</p>
              <button type="button" className="btn texto pequeno" onClick={onNova}><Icone nome="mais" tamanho={14} />Nova tarefa</button>
            </div>
          ) : <p className="vazio">{
              coluna === 'concluido' ? 'Nada concluído por enquanto.'
              : 'Nada em andamento. Inicie uma tarefa em A fazer e ela vem para cá.'}</p>}
      </div>

    </>
  );
}
