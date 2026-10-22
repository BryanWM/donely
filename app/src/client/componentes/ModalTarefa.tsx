import { useEffect, useState, type FormEvent } from 'react';
import {
  COLUNAS, diasParaArquivar, estaArquivada, NOME_PRIORIDADE, NOME_STATUS, PRIORIDADES,
  type Cliente, type Config, type Status, type Tarefa,
} from '../../shared/dominio';
import type { Acoes } from '../acoes';
import { SeloPrazo } from './Cartao';
import { Icone } from './Icone';
import { Modal } from './Modal';

interface Props {
  tarefa: Tarefa;
  config: Config;
  clientes: Cliente[];
  hoje: string;
  acoes: Acoes;
  onFechar: () => void;
}

const dataHora = (iso: string) => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

export function ModalTarefa({ tarefa: t, config, clientes, hoje, acoes, onFechar }: Props) {
  // Título e notas são salvos ao sair do campo, para não gravar a cada tecla.
  const [titulo, setTitulo] = useState(t.titulo);
  const [notas, setNotas] = useState(t.notas);
  const [novoItem, setNovoItem] = useState('');
  const [novoLink, setNovoLink] = useState({ url: '', rotulo: '' });
  const [novoCliente, setNovoCliente] = useState<string | null>(null);
  const [verHistorico, setVerHistorico] = useState(false);
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);

  // Ao trocar de tarefa, recomeça os rascunhos com os valores salvos.
  const [tarefaAtual, setTarefaAtual] = useState(t.id);
  if (tarefaAtual !== t.id) { setTarefaAtual(t.id); setTitulo(t.titulo); setNotas(t.notas); }

  useEffect(() => {
    if (!confirmarExclusao) return;
    const espera = setTimeout(() => setConfirmarExclusao(false), 4000);
    return () => clearTimeout(espera);
  }, [confirmarExclusao]);

  const arquivada = estaArquivada(t, config.arquivarAposDias, hoje);
  const faltam = diasParaArquivar(t, config.arquivarAposDias, hoje);
  const feitos = t.checklist.filter((i) => i.feito).length;
  const base = clientes.find((c) => c.nome === t.cliente)?.baseUrl;
  const nomesClientes = [...new Set([...clientes.map((c) => c.nome), ...(t.cliente ? [t.cliente] : [])])].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const tipos = [...new Set([...config.tipos, ...(t.tipo ? [t.tipo] : [])])];

  function salvarTitulo() {
    const v = titulo.trim();
    if (!v) { setTitulo(t.titulo); return; }
    if (v !== t.titulo) acoes.atualizar(t.id, { titulo: v });
  }

  async function addItem(e: FormEvent) {
    e.preventDefault();
    if (!novoItem.trim()) return;
    await acoes.adicionarItem(t.id, novoItem.trim());
    setNovoItem('');
  }

  async function addLink(e: FormEvent) {
    e.preventDefault();
    if (await acoes.adicionarLink(t.id, novoLink.url.trim(), novoLink.rotulo.trim())) setNovoLink({ url: '', rotulo: '' });
  }

  async function salvarNovoCliente(e: FormEvent) {
    e.preventDefault();
    const nome = (novoCliente ?? '').trim();
    if (!nome) return;
    if (!clientes.some((c) => c.nome.toLowerCase() === nome.toLowerCase())) await acoes.criarCliente(nome, null);
    await acoes.atualizar(t.id, { cliente: nome });
    setNovoCliente(null);
  }

  async function excluir() {
    if (!confirmarExclusao) { setConfirmarExclusao(true); return; }
    onFechar();
    await acoes.excluir(t.id);
  }

  return (
    <Modal grande titulo={arquivada ? 'Tarefa feita' : NOME_STATUS[t.status]} onFechar={onFechar}>
      <div className="detalhe">
        <div>
          <div className="lista-ios">
            <label className="sr" htmlFor="ed-titulo">Título</label>
            <textarea id="ed-titulo" className="campo-titulo" rows={1} value={titulo} onChange={(e) => setTitulo(e.target.value)} onBlur={salvarTitulo}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } }} />
            <label className="sr" htmlFor="ed-notas">Notas</label>
            <textarea id="ed-notas" className="campo-notas" value={notas} onChange={(e) => setNotas(e.target.value)}
              onBlur={() => { if (notas !== t.notas) acoes.atualizar(t.id, { notas }); }}
              placeholder="Notas: briefing, ideias, o que ficou combinado…" />
          </div>

          <section className="grupo-ios">
            <h3 className="grupo-titulo">Checklist <span className="contagem">{feitos}/{t.checklist.length}</span>
              {t.checklist.length > 0 && <span className="barra" aria-hidden="true"><i style={{ width: `${(feitos / t.checklist.length) * 100}%` }} /></span>}</h3>
            <div className="lista-ios">
              <ul className="lista-ios">
                {t.checklist.map((i) => (
                  <li key={i.id} className="linha-ios item-check">
                    <label><input type="checkbox" checked={i.feito} onChange={(e) => acoes.marcarItem(t.id, i.id, e.target.checked)} />
                      <span className={i.feito ? 'riscado' : ''}>{i.texto}</span></label>
                    <button type="button" className="btn icone-so" onClick={() => acoes.removerItem(t.id, i.id)} aria-label={`Remover ${i.texto}`}><Icone nome="x" tamanho={14} /></button>
                  </li>
                ))}
              </ul>
              <form className="linha-adicionar" onSubmit={addItem}>
                <label className="sr" htmlFor="novo-item">Novo item</label>
                <input id="novo-item" value={novoItem} onChange={(e) => setNovoItem(e.target.value)} placeholder="Adicionar item" autoComplete="off" />
                <button type="submit" className="btn texto pequeno" disabled={!novoItem.trim()}>Adicionar</button>
              </form>
            </div>
          </section>

          <section className="grupo-ios">
            <h3 className="grupo-titulo">Links <span className="contagem">{t.links.length}</span></h3>
            <div className="lista-ios">
              <ul className="lista-ios">
                {t.links.map((l) => (
                  <li key={l.id} className="linha-ios">
                    <a href={l.url} target="_blank" rel="noopener noreferrer"><Icone nome="link" />{l.rotulo || l.url}</a>
                    <button type="button" className="btn icone-so" onClick={() => acoes.removerLink(t.id, l.id)} aria-label="Remover link"><Icone nome="x" tamanho={14} /></button>
                  </li>
                ))}
              </ul>
              <form className="linha-adicionar" onSubmit={addLink}>
                <label className="sr" htmlFor="novo-link">Endereço</label>
                <input id="novo-link" type="url" value={novoLink.url} onChange={(e) => setNovoLink({ ...novoLink, url: e.target.value })} placeholder="https://… (Drive, Canva, Figma)" />
                <label className="sr" htmlFor="novo-link-rotulo">Nome do link</label>
                <input id="novo-link-rotulo" value={novoLink.rotulo} onChange={(e) => setNovoLink({ ...novoLink, rotulo: e.target.value })} placeholder="Nome (opcional)" style={{ maxWidth: 180 }} />
                <button type="submit" className="btn texto pequeno" disabled={!novoLink.url.trim()}>Adicionar</button>
              </form>
            </div>
          </section>
        </div>

        <div>
          <section className="grupo-ios">
            <ul className="lista-ios">
              <li className="linha-ios">
                <label htmlFor="ed-coluna">Coluna</label>
                <select id="ed-coluna" value={t.status} onChange={(e) => acoes.mover(t.id, e.target.value as Status)}>
                  {COLUNAS.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </li>
              <li className="linha-ios">
                <label htmlFor="ed-cliente">Cliente</label>
                {novoCliente !== null ? (
                  <form className="controle" onSubmit={salvarNovoCliente}>
                    <input id="ed-cliente" autoFocus value={novoCliente} onChange={(e) => setNovoCliente(e.target.value)} placeholder="Nome do cliente" />
                    <button type="submit" className="btn texto pequeno forte">Salvar</button>
                    <button type="button" className="btn texto pequeno" onClick={() => setNovoCliente(null)}>Cancelar</button>
                  </form>
                ) : (
                  <select id="ed-cliente" value={t.cliente} onChange={(e) => (e.target.value === '__novo' ? setNovoCliente('') : acoes.atualizar(t.id, { cliente: e.target.value }))}>
                    <option value="">Sem cliente</option>
                    {nomesClientes.map((c) => <option key={c}>{c}</option>)}
                    <option value="__novo">Novo cliente…</option>
                  </select>
                )}
              </li>
              <li className="linha-ios">
                <label htmlFor="ed-tipo">Tipo</label>
                <select id="ed-tipo" value={t.tipo} onChange={(e) => acoes.atualizar(t.id, { tipo: e.target.value })}>
                  <option value="">Sem tipo</option>{tipos.map((x) => <option key={x}>{x}</option>)}
                </select>
              </li>
              <li className="linha-ios">
                <span className="rotulo">Prioridade</span>
                <div className="segmentado" role="radiogroup" aria-label="Prioridade">
                  {PRIORIDADES.map((p) => (
                    <button key={p} type="button" role="radio" aria-checked={t.prioridade === p} className={t.prioridade === p ? 'ativo' : ''}
                      onClick={() => acoes.atualizar(t.id, { prioridade: p })}><span className={`ponto prioridade-${p}`} />{NOME_PRIORIDADE[p]}</button>
                  ))}
                </div>
              </li>
              <li className="linha-ios">
                <label htmlFor="ed-prazo">Prazo</label>
                <span className="controle">
                  <SeloPrazo tarefa={t} hoje={hoje} />
                  <input id="ed-prazo" type="date" value={t.prazo ?? ''} onChange={(e) => acoes.atualizar(t.id, { prazo: e.target.value || null })} />
                  {t.prazo && <button type="button" className="btn icone-so" onClick={() => acoes.atualizar(t.id, { prazo: null })} aria-label="Tirar prazo"><Icone nome="x" tamanho={14} /></button>}
                </span>
              </li>
            </ul>
          </section>

          {(base || t.origemUrl) && (
            <ul className="lista-ios">
              {base && <li className="linha-ios"><a href={base} target="_blank" rel="noopener noreferrer"><Icone nome="livro" />Base do cliente</a><Icone nome="externo" tamanho={14} /></li>}
              {t.origemUrl && <li className="linha-ios"><a href={t.origemUrl} target="_blank" rel="noopener noreferrer"><Icone nome="externo" />Abrir no Notion</a><Icone nome="externo" tamanho={14} /></li>}
            </ul>
          )}

          {t.status === 'concluido' && (
            <section className="grupo-ios">
              {!arquivada && <ul className="lista-ios"><li className="linha-ios acao"><button type="button" onClick={() => acoes.arquivar(t.id)}>Arquivar agora</button></li></ul>}
              <p className="grupo-nota">{arquivada ? 'Concluída. Está em Tarefas feitas.' : `Vai para Tarefas feitas ${faltam === 1 ? 'amanhã' : `em ${faltam} dias`}.`}</p>
            </section>
          )}

          <section className="grupo-ios">
            <ul className="lista-ios">
              <li className="linha-ios acao">
                <button type="button" aria-expanded={verHistorico} onClick={() => setVerHistorico(!verHistorico)}>
                  {verHistorico ? 'Ocultar histórico' : `Ver histórico (${t.eventos.length})`}
                </button>
              </li>
            </ul>
            {verHistorico && (
              <ol className="historico lista-ios">
                {[...t.eventos].reverse().map((ev, i) => <li key={i}><span>{dataHora(ev.em)}</span>{ev.texto}</li>)}
              </ol>
            )}
          </section>

          <ul className="lista-ios">
            <li className="linha-ios"><span className="rotulo">Criada</span><span className="valor">{dataHora(t.criadoEm)}</span></li>
            <li className="linha-ios"><span className="rotulo">Última alteração</span><span className="valor">{dataHora(t.atualizadoEm)}</span></li>
          </ul>

          <ul className="lista-ios">
            <li className="linha-ios acao perigo">
              <button type="button" onClick={excluir}>{confirmarExclusao ? 'Clique de novo para excluir' : 'Excluir tarefa'}</button>
            </li>
          </ul>
        </div>
      </div>
    </Modal>
  );
}
