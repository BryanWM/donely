import { useEffect, useRef, useState, type FormEvent } from 'react';
import { diaLocal, type Cliente, type Rascunho, type Tarefa } from '../../shared/dominio';
import type { Acoes } from '../acoes';
import { api } from '../api';
import { Icone } from './Icone';
import { DICA_MARKDOWN, Markdown, semMarkdown } from './Markdown';
import { Modal } from './Modal';

interface Props {
  tarefas: Tarefa[]; clientes: Cliente[]; hoje: string; acoes: Acoes;
  onAbrir: (id: string) => void; onAviso: (texto: string, extra?: { erro?: boolean; acao?: { rotulo: string; fn: () => void } }) => void;
  /** O Caderno pergunta se pode fechar: com o editor aberto, termina o salvamento pendente (false = não deu). */
  registrarGuarda: (fn: () => Promise<boolean>) => void;
}

const hora = (iso: string) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
const SALVAR_APOS_MS = 700;

/** Caderno › Ideias: rascunhos que amadurecem com o tempo. Pensar primeiro, organizar depois; separado da Captura rápida. */
export function Rascunhos({ tarefas, clientes, hoje, acoes, onAbrir, onAviso, registrarGuarda }: Props) {
  const [lista, setLista] = useState<Rascunho[] | null>(null);
  const [busca, setBusca] = useState('');
  const [aberto, setAberto] = useState<string | null>(null);
  const [renomeando, setRenomeando] = useState<{ id: string; titulo: string } | null>(null);
  const [confirmar, setConfirmar] = useState<string | null>(null);

  useEffect(() => { api.rascunhos().then(setLista).catch(() => onAviso('Não foi possível abrir as ideias.', { erro: true })); }, []);
  // sem editor aberto, nada pendente: pode fechar
  useEffect(() => { if (!aberto) registrarGuarda(async () => true); }, [aberto]);
  useEffect(() => {
    if (!confirmar) return;
    const t = setTimeout(() => setConfirmar(null), 4000);
    return () => clearTimeout(t);
  }, [confirmar]);

  const trocar = (r: Rascunho) => setLista((l) => [r, ...(l ?? []).filter((x) => x.id !== r.id)]);
  const quando = (iso: string) => { const d = diaLocal(new Date(iso)); return d === hoje ? `hoje às ${hora(iso)}` : d.split('-').reverse().join('/'); };
  const nomeVinculo = (v: Rascunho['vinculo']) => !v ? '' : v.tipo === 'cliente'
    ? `Cliente: ${clientes.find((c) => c.id === v.id)?.nome ?? 'removido'}`
    : `Tarefa: ${tarefas.find((t) => t.id === v.id)?.titulo ?? 'removida'}`;

  async function novo() {
    try { const r = await api.criarRascunho(); trocar(r); setAberto(r.id); }
    catch (e) { onAviso(e instanceof Error ? e.message : 'Não foi possível criar o rascunho.', { erro: true }); }
  }

  async function renomear(e: FormEvent) {
    e.preventDefault();
    if (!renomeando) return;
    try { trocar(await api.salvarRascunho(renomeando.id, { titulo: renomeando.titulo.trim() })); setRenomeando(null); }
    catch (err) { onAviso(err instanceof Error ? err.message : 'Não foi possível renomear.', { erro: true }); }
  }

  async function excluir(id: string) {
    if (confirmar !== id) { setConfirmar(id); return; }
    setConfirmar(null);
    try { await api.excluirRascunho(id); setLista((l) => (l ?? []).filter((x) => x.id !== id)); }
    catch (err) { onAviso(err instanceof Error ? err.message : 'Não foi possível excluir.', { erro: true }); }
  }

  const atual = lista?.find((r) => r.id === aberto);
  if (atual) {
    return <Editor rascunho={atual} tarefas={tarefas} clientes={clientes} acoes={acoes} onAbrir={onAbrir} onAviso={onAviso} onSalvo={trocar} registrarGuarda={registrarGuarda}
      onVoltar={(r) => {
        setAberto(null);
        // rascunho que ficou vazio não vira lixo no caderno
        if (!r.titulo.trim() && !r.conteudo.trim()) api.excluirRascunho(r.id).then(() => setLista((l) => (l ?? []).filter((x) => x.id !== r.id))).catch(() => {});
      }} />;
  }

  const q = busca.trim().toLowerCase();
  const visiveis = (lista ?? []).filter((r) => !q || r.titulo.toLowerCase().includes(q) || r.conteudo.toLowerCase().includes(q));

  return (
    <div className="caderno">
      <header className="caderno-cab">
        <div><h2>Ideias</h2><p>Rascunhos em desenvolvimento. Escreva sem compromisso; transforme em tarefa quando fizer sentido.</p></div>
        <label className="busca caderno-busca"><span className="sr">Buscar rascunhos</span><Icone nome="busca" />
          <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por título ou conteúdo" /></label>
        <button type="button" className="btn principal" onClick={novo}><Icone nome="mais" />Novo rascunho</button>
      </header>

      {!lista ? <p className="notas-dica">Carregando…</p> : !visiveis.length ? (
        <div className="vazio-grande"><Icone nome="ideia" tamanho={28} />
          <h3>{q ? 'Nenhum rascunho com essa busca' : 'Nenhum rascunho ainda'}</h3>
          <p>{q ? 'Tente outra palavra do título ou do texto.' : 'Teve uma ideia num brainstorm? Comece um rascunho e desenvolva no seu tempo.'}</p>
          {!q && <button type="button" className="btn texto pequeno" onClick={novo}><Icone nome="mais" tamanho={14} />Novo rascunho</button>}
        </div>
      ) : (
        <ul className="caderno-lista">
          {visiveis.map((r) => (
            <li key={r.id} className="rascunho-item">
              {renomeando?.id === r.id ? (
                <form className="rascunho-renomear" onSubmit={renomear}>
                  <label className="sr" htmlFor={`renomear-${r.id}`}>Novo título</label>
                  <input id={`renomear-${r.id}`} value={renomeando.titulo} onChange={(e) => setRenomeando({ ...renomeando, titulo: e.target.value })} autoFocus
                    onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); setRenomeando(null); } }} />
                  <button type="submit" className="btn principal pequeno">Salvar</button>
                  <button type="button" className="btn texto pequeno" onClick={() => setRenomeando(null)}>Cancelar</button>
                </form>
              ) : (
                <button type="button" className="rascunho-abrir" onClick={() => setAberto(r.id)}>
                  <strong className={r.titulo ? '' : 'sem-titulo'}>{r.titulo || 'Sem título'}</strong>
                  <span className="rascunho-previa">{semMarkdown(r.conteudo).trim() || 'Ainda sem texto.'}</span>
                  <span className="rascunho-meta">Editado {quando(r.atualizadoEm)} · criado {quando(r.criadoEm)}{r.vinculo && <span className="chip">{nomeVinculo(r.vinculo)}</span>}</span>
                </button>
              )}
              {renomeando?.id !== r.id && (
                <span className="rascunho-acoes">
                  <button type="button" className="btn texto pequeno" onClick={() => setRenomeando({ id: r.id, titulo: r.titulo })}>Renomear</button>
                  <button type="button" className={`btn perigo pequeno ${confirmar === r.id ? 'confirmando' : ''}`} onClick={() => excluir(r.id)}
                    aria-label={confirmar === r.id ? 'Confirmar exclusão do rascunho' : `Excluir ${r.titulo || 'rascunho sem título'}`}>{confirmar === r.id ? 'Confirmar exclusão' : 'Excluir'}</button>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface EditorProps {
  rascunho: Rascunho; tarefas: Tarefa[]; clientes: Cliente[]; acoes: Acoes; onAbrir: (id: string) => void;
  onAviso: Props['onAviso']; onSalvo: (r: Rascunho) => void; onVoltar: (r: Rascunho) => void; registrarGuarda: Props['registrarGuarda'];
}

/** Editor amplo: título e texto livre, salvos sozinhos pouco depois de parar de digitar. */
function Editor({ rascunho, tarefas, clientes, acoes, onAbrir, onAviso, onSalvo, onVoltar, registrarGuarda }: EditorProps) {
  const [titulo, setTitulo] = useState(rascunho.titulo);
  const [conteudo, setConteudo] = useState(rascunho.conteudo);
  const [estado, setEstado] = useState<'salvo' | 'pendente' | 'salvando' | 'erro'>('salvo');
  const [salvoEm, setSalvoEm] = useState(rascunho.atualizadoEm);
  const [transformar, setTransformar] = useState<string | null>(null);
  // abre já formatado quando tem texto; vazio, abre para escrever
  const [visualizar, setVisualizar] = useState(Boolean(rascunho.conteudo.trim()));
  const texto = useRef<HTMLTextAreaElement>(null);
  const pendente = useRef<{ titulo: string; conteudo: string } | null>(null);
  const espera = useRef<ReturnType<typeof setTimeout>>(undefined);

  async function gravar() {
    clearTimeout(espera.current);
    const dados = pendente.current;
    if (!dados) return rascunho;
    pendente.current = null; setEstado('salvando');
    try { const r = await api.salvarRascunho(rascunho.id, dados); onSalvo(r); setSalvoEm(r.atualizadoEm); setEstado(pendente.current ? 'pendente' : 'salvo'); return r; }
    catch { pendente.current = pendente.current ?? dados; setEstado('erro'); return null; }
  }
  function mudar(campos: { titulo?: string; conteudo?: string }) {
    const t = campos.titulo ?? titulo, c = campos.conteudo ?? conteudo;
    if (campos.titulo !== undefined) setTitulo(t);
    if (campos.conteudo !== undefined) setConteudo(c);
    pendente.current = { titulo: t, conteudo: c }; setEstado('pendente');
    clearTimeout(espera.current); espera.current = setTimeout(gravar, SALVAR_APOS_MS);
  }

  // texto ainda não salvo: atualizar ou fechar a aba pergunta antes; sair do editor salva na hora
  useEffect(() => {
    if (estado === 'salvo') return;
    const segurar = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', segurar);
    return () => window.removeEventListener('beforeunload', segurar);
  }, [estado]);
  useEffect(() => () => { if (pendente.current) gravar(); }, []);
  // fechar o Caderno com o editor aberto: termina o salvamento antes
  const guarda = useRef(async () => true);
  guarda.current = async () => (await gravar()) !== null;
  useEffect(() => { registrarGuarda(() => guarda.current()); }, []);

  async function voltar() {
    const r = await gravar();
    if (r === null && !window.confirm('Não foi possível salvar as últimas alterações. Sair mesmo assim?')) return;
    onVoltar({ ...rascunho, titulo, conteudo });
  }
  async function vincular(valor: string) {
    const [tipo, id] = valor.split(':') as ['cliente' | 'tarefa', string];
    try { onSalvo(await api.salvarRascunho(rascunho.id, { vinculo: valor ? { tipo, id } : null })); }
    catch (e) { onAviso(e instanceof Error ? e.message : 'Não foi possível salvar o vínculo.', { erro: true }); }
  }
  function abrirTransformar() {
    const t = texto.current, sel = t && t.selectionEnd > t.selectionStart ? conteudo.slice(t.selectionStart, t.selectionEnd) : '';
    setTransformar(sel.trim() || conteudo.trim());
  }

  const v = rascunho.vinculo, valorVinculo = v ? `${v.tipo}:${v.id}` : '';
  const abertas = tarefas.filter((t) => t.status !== 'concluido');
  const vinculoSumiu = v && !(v.tipo === 'cliente' ? clientes.some((c) => c.id === v.id) : tarefas.some((t) => t.id === v.id));

  return (
    <div className="caderno caderno-editor">
      <div className="editor-barra">
        <button type="button" className="btn texto pequeno" onClick={voltar}><Icone nome="anterior" tamanho={15} />Caderno</button>
        <span className={`nota-estado ${estado === 'pendente' || estado === 'erro' ? 'pendente' : ''}`} role="status">
          {estado === 'salvando' ? 'Salvando…' : estado === 'pendente' ? 'Alterações não salvas' : estado === 'erro' ? 'Não foi possível salvar. Tentando de novo ao continuar…' : <><Icone nome="check" tamanho={13} />Salvo às {hora(salvoEm)}</>}
        </span>
        <div className="segmentado" role="radiogroup" aria-label="Modo do editor" title={DICA_MARKDOWN}>
          <button type="button" role="radio" aria-checked={!visualizar} className={!visualizar ? 'ativo' : ''} onClick={() => setVisualizar(false)}>Escrever</button>
          <button type="button" role="radio" aria-checked={visualizar} className={visualizar ? 'ativo' : ''} onClick={() => setVisualizar(true)}>Visualizar</button>
        </div>
        <label className="editor-vinculo">
          <span className="sr">Vincular a um cliente ou tarefa</span>
          <select value={valorVinculo} onChange={(e) => vincular(e.target.value)}>
            <option value="">Sem vínculo</option>
            {vinculoSumiu && <option value={valorVinculo}>{v!.tipo === 'cliente' ? 'Cliente removido' : 'Tarefa removida'}</option>}
            {clientes.length > 0 && <optgroup label="Clientes">{clientes.map((c) => <option key={c.id} value={`cliente:${c.id}`}>{c.nome}</option>)}</optgroup>}
            {abertas.length > 0 && <optgroup label="Tarefas">{abertas.map((t) => <option key={t.id} value={`tarefa:${t.id}`}>{t.titulo}</option>)}</optgroup>}
          </select>
        </label>
        {v?.tipo === 'tarefa' && !vinculoSumiu && <button type="button" className="btn texto pequeno" onClick={() => onAbrir(v.id)}>Abrir tarefa</button>}
        <button type="button" className="btn principal pequeno" onClick={abrirTransformar} disabled={!conteudo.trim()} title="Selecione um trecho para levar só ele">
          <Icone nome="check" tamanho={14} />Transformar em tarefa
        </button>
      </div>
      <div className="editor-folha">
        <label className="sr" htmlFor="rascunho-titulo">Título</label>
        <input id="rascunho-titulo" className="editor-titulo" value={titulo} onChange={(e) => mudar({ titulo: e.target.value })} placeholder="Título do rascunho" autoComplete="off" />
        <label className="sr" htmlFor="rascunho-texto">Texto do rascunho</label>
        {visualizar ? (
          conteudo.trim() ? <div className="editor-previa" onDoubleClick={() => setVisualizar(false)} title="Clique duas vezes para editar"><Markdown texto={conteudo} /></div>
            : <button type="button" className="editor-previa vazio" onClick={() => setVisualizar(false)}>Nada escrito ainda. Clique para escrever.</button>
        ) : (
          <>
            <textarea id="rascunho-texto" ref={texto} className="editor-texto" value={conteudo} onChange={(e) => mudar({ conteudo: e.target.value })}
              placeholder="Escreva livremente: a ideia, as conexões, as dúvidas. Organize depois." autoFocus />
            <p className="dica-md">{DICA_MARKDOWN}</p>
          </>
        )}
      </div>
      {transformar !== null && (
        <Transformar trecho={transformar} rascunho={{ ...rascunho, titulo }} tarefas={tarefas} clientes={clientes} acoes={acoes} onAbrir={onAbrir} onAviso={onAviso}
          onFechar={() => setTransformar(null)} />
      )}
    </div>
  );
}

interface TransformarProps {
  trecho: string; rascunho: Rascunho; tarefas: Tarefa[]; clientes: Cliente[]; acoes: Acoes;
  onAbrir: (id: string) => void; onAviso: Props['onAviso']; onFechar: () => void;
}

/** Leva um trecho da ideia para uma tarefa nova ou existente. O rascunho fica como está. */
function Transformar({ trecho, rascunho, tarefas, clientes, acoes, onAbrir, onAviso, onFechar }: TransformarProps) {
  const [destino, setDestino] = useState<'nova' | 'existente'>('nova');
  const [conteudo, setConteudo] = useState(trecho);
  const [titulo, setTitulo] = useState((rascunho.titulo || trecho.split('\n')[0]).slice(0, 120));
  const locais = tarefas.filter((t) => t.status !== 'concluido');
  const [tarefaId, setTarefaId] = useState(rascunho.vinculo?.tipo === 'tarefa' && locais.some((t) => t.id === rascunho.vinculo!.id) ? rascunho.vinculo.id : locais[0]?.id ?? '');
  const [enviando, setEnviando] = useState(false);
  const cliente = rascunho.vinculo?.tipo === 'cliente' ? clientes.find((c) => c.id === rascunho.vinculo!.id)?.nome ?? '' : '';
  const origem = `Do rascunho "${rascunho.titulo || 'Sem título'}":\n`;

  async function confirmar(e: FormEvent) {
    e.preventDefault();
    if (!conteudo.trim() || (destino === 'nova' ? !titulo.trim() : !tarefaId)) return;
    setEnviando(true);
    try {
      if (destino === 'nova') {
        const t = await acoes.criar({ titulo: titulo.trim(), notas: origem + conteudo.trim(), cliente: cliente || undefined });
        if (!t) return;
        onAviso('Tarefa criada em A fazer. O rascunho continua no caderno.', { acao: { rotulo: 'Abrir', fn: () => onAbrir(t.id) } });
      } else {
        const t = locais.find((x) => x.id === tarefaId)!;
        await acoes.atualizar(t.id, { notas: (t.notas.trim() ? `${t.notas.trimEnd()}\n\n` : '') + origem + conteudo.trim() });
        onAviso(`Trecho levado ao briefing de "${t.titulo}". O rascunho continua no caderno.`, { acao: { rotulo: 'Abrir', fn: () => onAbrir(t.id) } });
      }
      onFechar();
    } finally { setEnviando(false); }
  }

  return (
    <Modal titulo="Transformar em tarefa" esquerda={<button type="button" className="btn texto" onClick={onFechar}>Cancelar</button>}
      direita={<button type="submit" form="form-transformar" className="btn texto forte" disabled={enviando || !conteudo.trim() || (destino === 'nova' ? !titulo.trim() : !tarefaId)}>{destino === 'nova' ? 'Criar tarefa' : 'Levar trecho'}</button>}
      onFechar={onFechar}>
      <form id="form-transformar" className="form-nova" onSubmit={confirmar}>
        <div className="segmentado transformar-destino" role="radiogroup" aria-label="Destino">
          <button type="button" role="radio" aria-checked={destino === 'nova'} className={destino === 'nova' ? 'ativo' : ''} onClick={() => setDestino('nova')}>Nova tarefa</button>
          <button type="button" role="radio" aria-checked={destino === 'existente'} className={destino === 'existente' ? 'ativo' : ''} onClick={() => setDestino('existente')}>Tarefa existente</button>
        </div>
        <ul className="lista-ios">
          {destino === 'nova' ? (
            <li className="linha-ios linha-base"><label htmlFor="tr-titulo">Título da tarefa</label>
              <input id="tr-titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} required /></li>
          ) : (
            <li className="linha-ios"><label htmlFor="tr-tarefa">Tarefa</label>
              {locais.length ? <select id="tr-tarefa" value={tarefaId} onChange={(e) => setTarefaId(e.target.value)}>{locais.map((t) => <option key={t.id} value={t.id}>{t.titulo}</option>)}</select>
                : <span className="valor">Nenhuma tarefa aberta criada no DONELY</span>}</li>
          )}
          <li className="linha-ios linha-base"><label htmlFor="tr-conteudo">O que vai para a tarefa</label>
            <textarea id="tr-conteudo" value={conteudo} onChange={(e) => setConteudo(e.target.value)} rows={6} /></li>
        </ul>
        <p className="grupo-nota">{destino === 'nova'
          ? `Vira o briefing de uma tarefa nova em A fazer${cliente ? `, do cliente ${cliente}` : ''}.`
          : 'Entra no fim do briefing da tarefa.'} O rascunho não muda.</p>
      </form>
    </Modal>
  );
}
