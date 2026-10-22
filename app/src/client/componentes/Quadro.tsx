import { useState, type FormEvent } from 'react';
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
  const [rapida, setRapida] = useState('');
  const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(null);

  const noQuadro = tarefas.filter((t) => !estaArquivada(t, config.arquivarAposDias, hoje));
  const q = busca.trim().toLowerCase();
  const visiveis = noQuadro.filter((t) => (!cliente || t.cliente === cliente) && (!tipo || t.tipo === tipo)
    && (!q || [t.titulo, t.cliente, t.notas].some((x) => x.toLowerCase().includes(q))));
  const clientes = [...new Set(noQuadro.map((t) => t.cliente).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const tipos = [...new Set([...config.tipos, ...noQuadro.map((t) => t.tipo).filter(Boolean)])];

  const daColuna = visiveis.filter((t) => t.status === coluna);
  const lista = coluna === 'concluido' ? daColuna.sort((a, b) => (b.concluidoEm ?? '').localeCompare(a.concluidoEm ?? '')) : ordenarTarefas(daColuna, hoje);

  async function adicionarRapida(e: FormEvent) {
    e.preventDefault();
    const titulo = rapida.trim();
    if (!titulo) return;
    if (await acoes.criar({ titulo, cliente: cliente || undefined, tipo: tipo || undefined })) setRapida('');
  }

  const tarefaMenu = menu && tarefas.find((t) => t.id === menu.id);

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
          Vão para Tarefas feitas {config.arquivarAposDias === 1 ? 'no dia seguinte' : `após ${config.arquivarAposDias} dias`} · <button type="button" onClick={onConfig}>Mudar</button></p>
      )}

      <div className="lista-cartoes">
        <div className="lista-cab" aria-hidden="true">
          <span>Tarefa</span><span>Cliente</span><span>Tipo</span><span>Prioridade</span><span>{coluna === 'concluido' ? 'Vai para feitas' : 'Prazo'}</span><span>Itens</span><span />
        </div>
        {coluna === 'a_fazer' && (
          <form className="linha-nova" onSubmit={adicionarRapida}>
            <button type="submit" className="mais-circulo" aria-label="Adicionar tarefa" disabled={!rapida.trim()}><Icone nome="mais" tamanho={14} /></button>
            <label className="sr" htmlFor="rapida">Nova tarefa</label>
            <input id="rapida" value={rapida} onChange={(e) => setRapida(e.target.value)} placeholder="Adicionar tarefa" autoComplete="off" />
            {rapida.trim() && <span className="dica-enter">Enter para adicionar</span>}
          </form>
        )}
        {lista.length
          ? lista.map((t) => <Cartao key={t.id} tarefa={t} hoje={hoje} arquivarAposDias={config.arquivarAposDias}
              onAbrir={() => onAbrir(t.id)} onMenu={(x, y) => setMenu({ id: t.id, x, y })} />)
          : <p className="vazio">{
              daColuna.length < noQuadro.filter((t) => t.status === coluna).length ? 'Nenhuma tarefa com esses filtros.'
              : coluna === 'a_fazer' ? (noQuadro.length ? 'Nada a fazer por aqui.' : 'Escreva acima a sua primeira tarefa.')
              : coluna === 'concluido' ? 'Arraste para esta pasta o que terminou.'
              : 'Nenhuma tarefa nesta pasta. Arraste um card até a pasta para mover.'}</p>}
      </div>

      {tarefaMenu && menu && (
        <>
          <div className="fundo-invisivel" onClick={() => setMenu(null)} />
          <div className="menu" role="menu" style={{ left: Math.max(8, Math.min(menu.x - 240, window.innerWidth - 248)), top: Math.min(menu.y + 6, window.innerHeight - 240) }}>
            <span className="menu-rotulo">Mover para</span>
            {COLUNAS.filter((c) => c.id !== tarefaMenu.status).map((c) => (
              <button key={c.id} type="button" role="menuitem" onClick={() => { setMenu(null); acoes.mover(tarefaMenu.id, c.id); }}>
                <span className={`ponto ponto-${c.id}`} />{c.nome}
              </button>
            ))}
            {tarefaMenu.status === 'concluido' && (
              <button type="button" role="menuitem" onClick={() => { setMenu(null); acoes.arquivar(tarefaMenu.id); }}><Icone nome="arquivo" />Arquivar agora</button>
            )}
          </div>
        </>
      )}
    </>
  );
}
