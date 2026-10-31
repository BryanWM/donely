import { useEffect, useRef, useState, type FormEvent } from 'react';
import { diaLocal, type Anotacao, type Pessoa } from '../../shared/dominio';
import { api } from '../api';
import { Icone } from './Icone';
import { DICA_MARKDOWN, Markdown } from './Markdown';

/** `registrarGuarda`: o Caderno pergunta a esta área se pode fechar (salva o que estiver aberto; false = não deu). */
interface Props { hoje: string; onAviso: (texto: string, extra?: { erro?: boolean }) => void; registrarGuarda: (fn: () => Promise<boolean>) => void }
/** O que está sendo escrito: uma anotação nova (sem id) ou a edição de uma existente, com o texto de antes para saber se mudou. */
interface Rascunho { id?: string; titulo: string; conteudo: string; antes: { titulo: string; conteudo: string } }

const hora = (iso: string) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
const DESCARTAR = 'Há alterações não salvas nesta anotação. Descartar?';

/** Caderno › Pessoas: a pessoa é a navegação, o dia organiza o histórico. Independente das tarefas e das Ideias. */
export function NotasPessoas({ hoje, onAviso, registrarGuarda }: Props) {
  const [pessoas, setPessoas] = useState<Pessoa[] | null>(null);
  const [anotacoes, setAnotacoes] = useState<Anotacao[]>([]);
  const [busca, setBusca] = useState('');
  const [selecionada, setSelecionada] = useState<string | null>(null);
  const [rascunho, setRascunho] = useState<Rascunho | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [salvoEm, setSalvoEm] = useState<string | null>(null);
  const [confirmar, setConfirmar] = useState<string | null>(null);

  const alterado = Boolean(rascunho && (rascunho.titulo !== rascunho.antes.titulo || rascunho.conteudo !== rascunho.antes.conteudo));
  const podeDescartar = () => !alterado || window.confirm(DESCARTAR);

  useEffect(() => {
    api.notas().then(({ pessoas: p, anotacoes: a }) => {
      setPessoas(p); setAnotacoes(a); // ninguém selecionado ao abrir: a pessoa escolhe
    }).catch(() => onAviso('Não foi possível abrir o bloco de notas.', { erro: true }));
  }, []);

  // atualizar ou fechar a aba com texto não salvo: o navegador pergunta antes
  useEffect(() => {
    if (!alterado) return;
    const segurar = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', segurar);
    return () => window.removeEventListener('beforeunload', segurar);
  }, [alterado]);

  useEffect(() => {
    if (!confirmar) return;
    const t = setTimeout(() => setConfirmar(null), 4000);
    return () => clearTimeout(t);
  }, [confirmar]);

  const q = busca.trim().toLowerCase();
  const visiveis = (pessoas ?? []).filter((p) => !q || p.nome.toLowerCase().includes(q));
  const nomeNovo = busca.trim() && !(pessoas ?? []).some((p) => p.nome.toLowerCase() === q) ? busca.trim() : '';
  const pessoa = (pessoas ?? []).find((p) => p.id === selecionada) ?? null;
  const daPessoa = anotacoes.filter((a) => a.pessoaId === selecionada);
  const dias = [...new Set(daPessoa.map((a) => diaLocal(new Date(a.criadoEm))))];
  if (rascunho && !rascunho.id && !dias.includes(hoje)) dias.unshift(hoje);
  const ultimaDe = (id: string) => anotacoes.find((a) => a.pessoaId === id);

  function rotuloDia(dia: string) {
    if (dia === hoje) return 'Hoje';
    const [a, m, d] = dia.split('-').map(Number), data = new Date(a, m - 1, d);
    const ontem = new Date(); ontem.setDate(ontem.getDate() - 1);
    if (dia === diaLocal(ontem)) return 'Ontem';
    return data.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: a === new Date().getFullYear() ? undefined : 'numeric' }).replace(/^./, (c) => c.toUpperCase());
  }
  function dataCurta(iso: string) {
    const dia = diaLocal(new Date(iso));
    return dia === hoje ? 'hoje' : rotuloDia(dia) === 'Ontem' ? 'ontem' : dia.split('-').reverse().slice(0, 2).join('/');
  }

  function escolher(id: string) {
    if (id === selecionada || !podeDescartar()) return;
    setSelecionada(id); setRascunho(null); setSalvoEm(null);
  }
  function escrever(r: Rascunho | null) { if (podeDescartar()) setRascunho(r); }

  async function adicionarPessoa(e?: FormEvent) {
    e?.preventDefault();
    if (!nomeNovo || !podeDescartar()) return;
    try {
      const p = await api.criarPessoa(nomeNovo);
      setPessoas((lista) => [...(lista ?? []), p].sort((x, y) => x.nome.localeCompare(y.nome, 'pt-BR')));
      setSelecionada(p.id); setBusca(''); setRascunho({ titulo: '', conteudo: '', antes: { titulo: '', conteudo: '' } }); setSalvoEm(null);
    } catch (err) { onAviso(err instanceof Error ? err.message : 'Não foi possível adicionar a pessoa.', { erro: true }); }
  }

  async function salvar(e?: FormEvent): Promise<boolean> {
    e?.preventDefault();
    if (!rascunho || !pessoa || !rascunho.conteudo.trim() || salvando) return false;
    setSalvando(true);
    try {
      const dados = { titulo: rascunho.titulo.trim(), conteudo: rascunho.conteudo };
      const a = rascunho.id ? await api.editarAnotacao(rascunho.id, dados) : await api.criarAnotacao(pessoa.id, dados);
      setAnotacoes((lista) => (rascunho.id ? lista.map((x) => (x.id === a.id ? a : x)) : [a, ...lista]));
      setRascunho(null); setSalvoEm(hora(a.atualizadoEm));
      return true;
    } catch (err) { onAviso(err instanceof Error ? err.message : 'Não foi possível salvar. O texto continua aqui.', { erro: true }); return false; }
    finally { setSalvando(false); }
  }

  // Ao fechar o Caderno: anotação com texto é salva antes; sem texto, pergunta se descarta.
  const guarda = useRef(async () => true);
  guarda.current = async () => !alterado || (rascunho?.conteudo.trim() ? salvar() : window.confirm(DESCARTAR));
  useEffect(() => { registrarGuarda(() => guarda.current()); }, []);

  async function excluir(id: string) {
    if (confirmar !== id) { setConfirmar(id); return; }
    setConfirmar(null);
    try { await api.excluirAnotacao(id); setAnotacoes((lista) => lista.filter((a) => a.id !== id)); }
    catch (err) { onAviso(err instanceof Error ? err.message : 'Não foi possível excluir.', { erro: true }); }
  }

  const editor = rascunho && (
    <form className="nota nota-editor" onSubmit={salvar} onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) salvar(e); }}>
      <label className="sr" htmlFor="nota-titulo">Título (opcional)</label>
      <input id="nota-titulo" className="nota-titulo-campo" value={rascunho.titulo} onChange={(e) => setRascunho({ ...rascunho, titulo: e.target.value })} placeholder="Título (opcional)" autoComplete="off" />
      <label className="sr" htmlFor="nota-conteudo">Anotação</label>
      <textarea id="nota-conteudo" className="nota-conteudo-campo" value={rascunho.conteudo} onChange={(e) => setRascunho({ ...rascunho, conteudo: e.target.value })}
        placeholder="O que foi conversado, o que ficou decidido, o que ficou pendente…" autoFocus />
      <p className="dica-md">{DICA_MARKDOWN}</p>
      <div className="nota-editor-rodape">
        <span className={`nota-estado ${alterado ? 'pendente' : ''}`} role="status">
          {!rascunho.conteudo.trim() ? 'Escreva alguma coisa para salvar' : alterado ? 'Alterações não salvas' : 'Sem alterações'}
        </span>
        <button type="button" className="btn texto pequeno" onClick={() => escrever(null)}>Cancelar</button>
        <button type="submit" className="btn principal pequeno" disabled={!rascunho.conteudo.trim() || salvando || !alterado} title="Salvar (Ctrl+Enter)">{salvando ? 'Salvando…' : 'Salvar'}</button>
      </div>
    </form>
  );

  return (
      <div className="notas">
        <aside className="notas-pessoas" aria-label="Pessoas">
          <form className="busca notas-busca" onSubmit={adicionarPessoa}>
            <label className="sr" htmlFor="notas-busca">Buscar ou adicionar pessoa</label>
            <Icone nome="busca" /><input id="notas-busca" type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar ou adicionar pessoa" autoComplete="off" />
          </form>
          {nomeNovo && <button type="button" className="btn texto pequeno notas-adicionar" onClick={() => adicionarPessoa()}><Icone nome="mais" tamanho={14} />Adicionar “{nomeNovo}”</button>}
          <ul className="notas-lista">
            {visiveis.map((p) => {
              const ultima = ultimaDe(p.id), qtd = anotacoes.filter((a) => a.pessoaId === p.id).length;
              return (
                <li key={p.id}>
                  <button type="button" className={`notas-pessoa ${p.id === selecionada ? 'ativa' : ''}`} aria-current={p.id === selecionada} onClick={() => escolher(p.id)}>
                    <span className="texto-corte">{p.nome}</span>
                    <small>{qtd ? `${qtd} ${qtd === 1 ? 'anotação' : 'anotações'} · ${dataCurta(ultima!.criadoEm)}` : 'Sem anotações'}</small>
                  </button>
                </li>
              );
            })}
          </ul>
          {pessoas && !pessoas.length && !busca && <p className="notas-dica">Digite um nome acima para adicionar a primeira pessoa.</p>}
          {pessoas && pessoas.length > 0 && !visiveis.length && !nomeNovo && <p className="notas-dica">Ninguém com esse nome.</p>}
        </aside>

        <section className="notas-principal" aria-label={pessoa ? `Anotações de ${pessoa.nome}` : 'Anotações'}>
          {!pessoas ? <p className="notas-dica">Carregando…</p> : !pessoa ? (
            <div className="vazio-grande"><Icone nome="notas" tamanho={28} /><h3>Selecione alguém da equipe</h3><p>Escolha uma pessoa à esquerda para consultar ou criar anotações. Se ela ainda não está na lista, digite o nome na busca.</p></div>
          ) : <>
            <header className="notas-cab">
              <div><h2>{pessoa.nome}</h2><p>{daPessoa.length ? `${daPessoa.length} ${daPessoa.length === 1 ? 'anotação' : 'anotações'}` : 'Nenhuma anotação ainda'}{salvoEm && <span className="nota-salvo"> · <Icone nome="check" tamanho={13} />Salvo às {salvoEm}</span>}</p></div>
              <button type="button" className="btn principal" onClick={() => escrever({ titulo: '', conteudo: '', antes: { titulo: '', conteudo: '' } })} disabled={Boolean(rascunho && !rascunho.id)}>
                <Icone nome="mais" />Nova anotação de hoje
              </button>
            </header>
            {!dias.length && <p className="notas-dica">Registre o que foi conversado com {pessoa.nome}: decisões, informações recebidas e o que ficou pendente.</p>}
            {dias.map((dia) => (
              <div key={dia} className="notas-dia">
                <h3>{rotuloDia(dia)}</h3>
                {dia === hoje && rascunho && !rascunho.id && editor}
                {daPessoa.filter((a) => diaLocal(new Date(a.criadoEm)) === dia).map((a) => (rascunho?.id === a.id ? <div key={a.id}>{editor}</div> : (
                  <article key={a.id} className="nota">
                    <header className="nota-cab">
                      {a.titulo && <h4>{a.titulo}</h4>}
                      <span className="nota-hora">{hora(a.criadoEm)}{a.atualizadoEm !== a.criadoEm && ` · editada ${dataCurta(a.atualizadoEm) === 'hoje' ? '' : dataCurta(a.atualizadoEm) + ' '}às ${hora(a.atualizadoEm)}`}</span>
                      <span className="nota-acoes">
                        <button type="button" className="btn texto pequeno" onClick={() => escrever({ id: a.id, titulo: a.titulo, conteudo: a.conteudo, antes: { titulo: a.titulo, conteudo: a.conteudo } })}>Editar</button>
                        <button type="button" className={`btn perigo pequeno ${confirmar === a.id ? 'confirmando' : ''}`} onClick={() => excluir(a.id)}
                          aria-label={confirmar === a.id ? 'Confirmar exclusão da anotação' : `Excluir anotação das ${hora(a.criadoEm)}`}>{confirmar === a.id ? 'Confirmar exclusão' : 'Excluir'}</button>
                      </span>
                    </header>
                    <Markdown className="nota-conteudo" texto={a.conteudo} />
                  </article>
                )))}
              </div>
            ))}
          </>}
        </section>
      </div>
  );
}
