import { useEffect, useState, type FormEvent } from 'react';
import {
  diasParaArquivar, estaArquivada, NOME_PRIORIDADE, NOME_STATUS, PRIORIDADES, situacaoPrazo,
  type Cliente, type Config, type Tarefa,
} from '../../shared/dominio';
import type { Acoes } from '../acoes';
import { MaterialProduzido } from './Anexos';
import { Prioridade, SeloPrazo } from './Cartao';
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

/** Briefing só leitura: quebras de linha preservadas e endereços http(s) clicáveis, abrindo em nova aba. */
function comLinks(texto: string) {
  return texto.split(/(https?:\/\/[^\s<>"]+)/g).map((parte, i) =>
    i % 2 ? <a key={i} href={parte} target="_blank" rel="noopener noreferrer">{parte}</a> : parte);
}

const dataHora = (iso: string) => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

export function ModalTarefa({ tarefa: t, config, clientes, hoje, acoes, onFechar }: Props) {
  // Título e notas são salvos ao sair do campo, para não gravar a cada tecla.
  const [titulo, setTitulo] = useState(t.titulo);
  const [notas, setNotas] = useState(t.notas);
  const [novoItem, setNovoItem] = useState('');
  const [novoCliente, setNovoCliente] = useState<string | null>(null);
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
  // Só em Fazendo se trabalha no card: em A fazer ainda não começou, em Concluído já terminou.
  const leitura = t.status !== 'fazendo';
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


  async function salvarNovoCliente(e: FormEvent) {
    e.preventDefault();
    const nome = (novoCliente ?? '').trim();
    if (!nome) return;
    if (!clientes.some((c) => c.nome.toLowerCase() === nome.toLowerCase())) await acoes.criarCliente(nome);
    await acoes.atualizar(t.id, { cliente: nome });
    setNovoCliente(null);
  }

  async function excluir() {
    if (!confirmarExclusao) { setConfirmarExclusao(true); return; }
    onFechar();
    await acoes.excluir(t.id);
  }

  const materiais = t.anexos.filter((a) => a.papel === 'material');
  const referencias = t.anexos.filter((a) => a.papel === 'referencia');

  return (
    <Modal grande titulo={arquivada ? 'Tarefa feita' : NOME_STATUS[t.status]} onFechar={onFechar}>
      <div className="card">
        <div className="card-fluxo">
          <div className="card-cab">
            <label className="sr" htmlFor="ed-titulo">Título</label>
            <textarea id="ed-titulo" className="card-titulo" rows={1} readOnly={leitura} value={titulo} onChange={(e) => setTitulo(e.target.value)} onBlur={salvarTitulo}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } }} />
            <p className="card-sub">{[t.cliente, t.tipo].filter(Boolean).join(' · ') || 'Sem cliente'}{t.prazo && t.status !== 'concluido' && <> · <SeloPrazo tarefa={t} hoje={hoje} /></>}</p>
          </div>

          {t.status === 'a_fazer' && (
            <div className="aviso-leitura">
              <span><Icone nome="alerta" tamanho={15} />Só leitura enquanto estiver em “A fazer”.</span>
              <button type="button" className="btn principal pequeno" onClick={() => acoes.mover(t.id, 'fazendo')}><Icone nome="play" tamanho={14} />Iniciar tarefa</button>
            </div>
          )}

          <ol className="passos">
            <li className="passo">
              <span className="passo-num" aria-hidden="true">1</span>
              <div className="passo-corpo">
                <h3 className="passo-titulo">Briefing</h3>
                {!leitura ? (
                  <>
                    <label className="sr" htmlFor="ed-notas">Briefing</label>
                    <textarea id="ed-notas" className="card-briefing" value={notas} onChange={(e) => setNotas(e.target.value)}
                      onBlur={() => { if (notas !== t.notas) acoes.atualizar(t.id, { notas }); }} placeholder="O que precisa ser feito, para quem, o que não pode faltar…" />
                  </>
                ) : <div className="card-texto" aria-label="Briefing">{t.notas ? comLinks(t.notas) : <span className="sem-valor">Sem briefing.</span>}</div>}
              </div>
            </li>

            <li className="passo">
              <span className="passo-num" aria-hidden="true">2</span>
              <div className="passo-corpo">
                <h3 className="passo-titulo">Referências <span className="contagem">{referencias.length || ''}</span></h3>
                <MaterialProduzido somenteLeitura={leitura} acao="Adicionar referências" dica="Imagens, PDFs ou documentos que orientam o trabalho. Arraste, cole (Ctrl+V) ou clique." vazio="Nenhuma referência."
                  itens={referencias.map((a) => ({ chave: a.id, nome: a.nome, tipo: a.tipo, url: `/api/anexos/${a.id}` }))}
                  onAdicionar={(arquivos) => acoes.anexar(t.id, arquivos, 'referencia')} onRemover={(anexo) => acoes.removerAnexo(t.id, anexo)} />
              </div>
            </li>

            <li className="passo">
              <span className="passo-num" aria-hidden="true">3</span>
              <div className="passo-corpo">
                <h3 className="passo-titulo">Checklist {t.checklist.length > 0 && <span className="contagem">{feitos}/{t.checklist.length}</span>}
                  {t.checklist.length > 0 && <span className="barra" aria-hidden="true"><i style={{ width: `${(feitos / t.checklist.length) * 100}%` }} /></span>}</h3>
                <ul className="lista-ios checklist">
                  {t.checklist.map((i) => (
                    <li key={i.id} className="linha-ios item-check">
                      <label><input type="checkbox" checked={i.feito} disabled={leitura} onChange={(e) => acoes.marcarItem(t.id, i.id, e.target.checked)} />
                        <span className={i.feito ? 'riscado' : ''}>{i.texto}</span></label>
                      {!leitura && <button type="button" className="btn icone-so" onClick={() => acoes.removerItem(t.id, i.id)} aria-label={`Remover ${i.texto}`}><Icone nome="x" tamanho={14} /></button>}
                    </li>
                  ))}
                </ul>
                {leitura ? !t.checklist.length && <p className="passo-vazio">Sem itens.</p> : (
                  <form className="checklist-novo" onSubmit={addItem}>
                    <Icone nome="mais" tamanho={15} />
                    <label className="sr" htmlFor="novo-item">Novo item</label>
                    <input id="novo-item" required value={novoItem} onChange={(e) => setNovoItem(e.target.value)} placeholder="Adicionar item e Enter" autoComplete="off" />
                  </form>
                )}
              </div>
            </li>

            <li className="passo passo-entrega">
              <span className="passo-num" aria-hidden="true">4</span>
              <div className="passo-corpo">
                <h3 className="passo-titulo">Material produzido <span className="contagem">{materiais.length || ''}</span></h3>
                <MaterialProduzido somenteLeitura={leitura} itens={materiais.map((a) => ({ chave: a.id, nome: a.nome, tipo: a.tipo, url: `/api/anexos/${a.id}` }))}
                  onAdicionar={(arquivos) => acoes.anexar(t.id, arquivos)} onRemover={(anexo) => acoes.removerAnexo(t.id, anexo)} />
              </div>
            </li>
          </ol>
        </div>

        <aside className="card-lado">
          <section aria-label="Propriedades">
                        {leitura ? (
            <ul className="lista-ios props">
              <li className="linha-ios"><span className="rotulo">Cliente</span><span className="valor">{t.cliente || '—'}</span></li>
              <li className="linha-ios"><span className="rotulo">Tipo</span><span className="valor">{t.tipo || '—'}</span></li>
              <li className="linha-ios"><span className="rotulo">Prioridade</span><Prioridade valor={t.prioridade} /></li>
              <li className="linha-ios"><span className="rotulo">Prazo</span><span className="valor">{t.prazo ? t.prazo.split('-').reverse().join('/') : '—'}</span></li>
            </ul>
            ) : (
            <ul className="lista-ios props">
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
                  {/* só o selo de atenção (atrasada, vence hoje): a data em si o campo já mostra */}
                  {['atrasada', 'hoje'].includes(situacaoPrazo(t, hoje)?.tipo ?? '') && <SeloPrazo tarefa={t} hoje={hoje} />}
                  <input id="ed-prazo" type="date" value={t.prazo ?? ''} onClick={(e) => { try { e.currentTarget.showPicker?.(); } catch { /* sem showPicker */ } }} onChange={(e) => acoes.atualizar(t.id, { prazo: e.target.value || null })} />
                  {t.prazo && <button type="button" className="btn icone-so" onClick={() => acoes.atualizar(t.id, { prazo: null })} aria-label="Remover prazo"><Icone nome="x" tamanho={14} /></button>}
                </span>
              </li>
            </ul>
            )}
          </section>

          {t.status === 'concluido' && (
            <section className="lado-concluida">
              <p>{arquivada ? 'Concluída. Está no Histórico.' : `Vai para o Histórico ${faltam === 1 ? 'amanhã' : `em ${faltam} dias`}.`}</p>
            </section>
          )}

          <div className="lado-rodape">
            <details className="registro-detalhes">
              <summary>Histórico · {t.eventos.length} {t.eventos.length === 1 ? 'registro' : 'registros'}</summary>
              <dl>
                <div><dt>Criada</dt><dd>{dataHora(t.criadoEm)}</dd></div>
                <div><dt>Última alteração</dt><dd>{dataHora(t.atualizadoEm)}</dd></div>
              </dl>
              <ol className="historico">{[...t.eventos].reverse().map((ev, i) => <li key={i}><span>{dataHora(ev.em)}</span>{ev.texto}</li>)}</ol>
            </details>
            <button type="button" className={`excluir ${confirmarExclusao ? 'confirmando' : ''}`} onClick={excluir}>{confirmarExclusao ? 'Clique de novo para confirmar a exclusão' : 'Excluir tarefa'}</button>
          </div>
        </aside>
      </div>
    </Modal>
  );
}
