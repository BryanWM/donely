import { useState, type FormEvent } from 'react';
import { NOME_PRIORIDADE, PRIORIDADES, somarDias, type Cliente, type Config, type Prioridade } from '../../shared/dominio';
import type { Acoes } from '../acoes';
import { Icone } from './Icone';
import { Modal } from './Modal';

interface Props { hoje: string; config: Config; clientes: Cliente[]; acoes: Acoes; onFechar: () => void; onCriada: (id: string) => void }

const NOVO = '__novo';
const lista = new Intl.ListFormat('pt-BR', { type: 'conjunction' });
const ehLink = (u: string) => /^https?:\/\/\S+$/i.test(u);
/** Abre a lista ou o calendário nativo (o rótulo, sozinho, só daria foco). */
const abrir = (id: string) => () => { try { (document.getElementById(id) as HTMLInputElement | null)?.showPicker?.(); } catch { /* navegador sem showPicker: fica só o foco */ } };

export function ModalNova({ hoje, config, clientes, acoes, onFechar, onCriada }: Props) {
  const [f, setF] = useState({ titulo: '', cliente: '', novoCliente: '', tipo: '', prioridade: 'normal' as Prioridade, prazo: somarDias(hoje, 3), briefing: '', checklist: '', base: '' });
  const [tentou, setTentou] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const mudar = (campo: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [campo]: e.target.value }));


  const clienteEscolhido = clientes.find((c) => c.nome === f.cliente);
  function escolherCliente(nome: string) {
    // A referência acompanha o cliente: mostra a base que ele já tem.
    setF((x) => ({ ...x, cliente: nome, base: clientes.find((c) => c.nome === nome)?.baseUrl ?? '' }));
  }

  const novo = f.cliente === NOVO;
  const faltando = [
    !f.titulo.trim() && ['titulo', 'título'],
    !(novo ? f.novoCliente.trim() : f.cliente) && ['cliente', 'cliente'],
    !f.tipo && ['tipo', 'tipo de entrega'],
    !f.briefing.trim() && ['briefing', 'briefing'],
  ].filter(Boolean) as [string, string][];
  const prazoPassado = Boolean(f.prazo) && f.prazo < hoje;
  const baseInvalida = Boolean(f.base.trim()) && !ehLink(f.base.trim());
  const mensagens = [
    faltando.length ? `Preencha ${lista.format(faltando.map(([, n]) => n))}.` : '',
    prazoPassado ? 'Escolha um prazo de hoje em diante.' : '',
    baseInvalida ? 'Use um link da base que comece com https://.' : '',
  ].filter(Boolean);
  const invalido = (campo: string) => tentou && (faltando.some(([c]) => c === campo) || (campo === 'prazo' && prazoPassado) || (campo === 'base' && baseInvalida));
  const marcar = (campo: string) => (invalido(campo) ? { 'aria-invalid': true, 'aria-describedby': 'nova-erros' } : {});

  async function criar(e: FormEvent) {
    e.preventDefault();
    setTentou(true);
    if (mensagens.length) {
      const primeiro = faltando[0]?.[0] ?? (prazoPassado ? 'prazo' : 'base');
      document.getElementById(`nv-${primeiro === 'cliente' && novo ? 'novo-cliente' : primeiro}`)?.focus();
      return;
    }
    if (enviando) return;
    setEnviando(true);
    const nomeCliente = novo ? f.novoCliente.trim() : f.cliente;
    const base = f.base.trim() || null;
    // A base é do cliente: guardada nele, aparece em todas as tarefas dele.
    if (novo && !clientes.some((c) => c.nome.toLowerCase() === nomeCliente.toLowerCase())) await acoes.criarCliente(nomeCliente, base);
    else if (clienteEscolhido && base !== clienteEscolhido.baseUrl && base) await acoes.atualizarCliente(clienteEscolhido.id, base);
    const t = await acoes.criar({
      titulo: f.titulo.trim(), cliente: nomeCliente, tipo: f.tipo, prioridade: f.prioridade, prazo: f.prazo || null,
      notas: f.briefing.trim(), checklist: f.checklist.split('\n').map((s) => s.trim()).filter(Boolean),
    });
    setEnviando(false);
    if (t) onCriada(t.id);
  }

  return (
    <Modal largo titulo="Nova tarefa" onFechar={onFechar} rodape={
      <>
        {tentou && mensagens.length > 0 && <p id="nova-erros" className="rodape-erro" role="alert"><Icone nome="alerta" />{mensagens.join(' ')}</p>}
        <button type="button" className="btn" onClick={onFechar}>Cancelar</button>
        <button type="submit" form="form-nova" className="btn principal" disabled={enviando}>{enviando ? 'Criando…' : 'Criar tarefa'}</button>
      </>
    }>
      <form id="form-nova" className="form-nova" onSubmit={criar} noValidate>
        <div className="lista-ios">
          <label className="sr" htmlFor="nv-titulo">Título</label>
          <textarea id="nv-titulo" className="campo-titulo" rows={1} value={f.titulo} onChange={mudar('titulo')} placeholder="Título da tarefa"
            onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }} {...marcar('titulo')} />
        </div>

        <div className="nova-colunas">
          <div>
            <section className="grupo-ios">
              <ul className="lista-ios">
                <li className="linha-ios">
                  <label htmlFor={novo ? 'nv-novo-cliente' : 'nv-cliente'} onClick={novo ? undefined : abrir('nv-cliente')}>Cliente</label>
                  {novo ? (
                    <span className="controle">
                      <input id="nv-novo-cliente" autoFocus value={f.novoCliente} onChange={mudar('novoCliente')} placeholder="Nome do cliente novo" {...marcar('cliente')} />
                      <button type="button" className="btn texto pequeno" onClick={() => escolherCliente('')}>Cancelar</button>
                    </span>
                  ) : (
                    <select id="nv-cliente" value={f.cliente} onChange={(e) => escolherCliente(e.target.value)} {...marcar('cliente')}>
                      <option value="" disabled>Escolha o cliente</option>
                      {clientes.map((c) => <option key={c.id}>{c.nome}</option>)}
                      <option value={NOVO}>Novo cliente…</option>
                    </select>
                  )}
                </li>
                <li className="linha-ios">
                  <label htmlFor="nv-tipo" onClick={abrir('nv-tipo')}>Tipo de entrega</label>
                  <select id="nv-tipo" value={f.tipo} onChange={mudar('tipo')} {...marcar('tipo')}>
                    <option value="" disabled>Escolha o tipo</option>
                    {config.tipos.map((x) => <option key={x}>{x}</option>)}
                  </select>
                </li>
              </ul>
            </section>
            <section className="grupo-ios">
              <h3 className="grupo-titulo">Prioridade e prazo</h3>
              <ul className="lista-ios">
                <li className="linha-ios">
                  <span className="rotulo">Prioridade</span>
                  <div className="segmentado" role="radiogroup" aria-label="Prioridade">
                    {PRIORIDADES.map((p) => (
                      <button key={p} type="button" role="radio" aria-checked={f.prioridade === p} className={f.prioridade === p ? 'ativo' : ''}
                        onClick={() => setF((x) => ({ ...x, prioridade: p }))}><span className={`ponto prioridade-${p}`} />{NOME_PRIORIDADE[p]}</button>
                    ))}
                  </div>
                </li>
                <li className="linha-ios">
                  <label htmlFor="nv-prazo" onClick={abrir('nv-prazo')}>Prazo</label>
                  <span className="controle">
                    <input id="nv-prazo" type="date" min={hoje} onClick={abrir('nv-prazo')} value={f.prazo} onChange={mudar('prazo')} {...marcar('prazo')} />
                    {f.prazo && <button type="button" className="btn icone-so" onClick={() => setF((x) => ({ ...x, prazo: '' }))} aria-label="Remover prazo"><Icone nome="x" tamanho={14} /></button>}
                  </span>
                </li>
              </ul>
            </section>
            <section className="grupo-ios">
              <h3 className="grupo-titulo">Referências <span className="opcional">opcional</span></h3>
              <ul className="lista-ios">
                <li className="linha-ios linha-base">
                  <label htmlFor="nv-base">Base do cliente</label>
                  <span className="controle controle-base">
                    <input id="nv-base" type="url" value={f.base} onChange={mudar('base')} placeholder="https://…" {...marcar('base')} />
                    {ehLink(f.base.trim()) && <a href={f.base.trim()} target="_blank" rel="noopener noreferrer" aria-label="Abrir a base em nova aba"><Icone nome="externo" tamanho={15} /></a>}
                  </span>
                </li>
              </ul>
              <p className="grupo-nota">{clienteEscolhido?.baseUrl ? 'Base que este cliente já tem. Se mudar, atualiza para todas as tarefas dele.' : 'Fica salva no cliente e aparece em todas as tarefas dele.'}</p>
            </section>
          </div>
          <div>
            <section className="grupo-ios">
              <h3 className="grupo-titulo">Briefing</h3>
              <div className="lista-ios">
                <label className="sr" htmlFor="nv-briefing">Briefing</label>
                <textarea id="nv-briefing" className="campo-notas" value={f.briefing} onChange={mudar('briefing')}
                  placeholder="O que precisa ser feito, para quem, o que não pode faltar…" {...marcar('briefing')} />
              </div>
            </section>
            <section className="grupo-ios">
              <h3 className="grupo-titulo">Checklist <span className="opcional">opcional</span></h3>
              <div className="lista-ios">
                <label className="sr" htmlFor="nv-checklist">Checklist, um item por linha</label>
                <textarea id="nv-checklist" className="campo-notas campo-checklist" value={f.checklist} onChange={mudar('checklist')} placeholder={'Ex.:\nCapa\nTelas internas\nRevisão'} />
              </div>
              <p className="grupo-nota">Cada linha vira um item.</p>
            </section>
          </div>
        </div>
      </form>
    </Modal>
  );
}
