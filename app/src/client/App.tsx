import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import logo from '../../../brand/donely-icone.svg';
import { COLUNAS, diaLocal, estaArquivada, formatarDuracao, inicioDaSemana, NOME_STATUS, situacaoPrazo, tempoDemanda, type Demanda, type Status, type Tarefa } from '../shared/dominio';
import type { Acoes } from './acoes';
import { api, type Estado } from './api';
import { Comemoracao } from './componentes/Comemoracao';
import { pulsarContagem } from './voo';
import { CapturaRapida } from './componentes/CapturaRapida';
import { Configuracoes } from './componentes/Configuracoes';
import { Historico } from './componentes/Historico';
import { Demandas, useAgora } from './componentes/Demandas';
import { Icone } from './componentes/Icone';
import { ModalNova } from './componentes/ModalNova';
import { ModalTarefa } from './componentes/ModalTarefa';
import { Quadro } from './componentes/Quadro';

interface Aviso { id: number; texto: string; erro?: boolean; acao?: { rotulo: string; fn: () => void } }
const mensagem = (e: unknown) => (e instanceof Error ? e.message : 'Sem resposta do servidor. Confira se o DONELY está rodando e tente de novo.');
type Vista = Status | 'demandas' | 'historico';
const ABAS: Vista[] = [...COLUNAS.map((c) => c.id), 'demandas', 'historico'];

/** Cronômetro do topo: só ele relê o relógio a cada segundo (no App, a lista inteira renderizava junto). */
function TempoCorrendo({ demanda }: { demanda: Demanda }) {
  const agora = useAgora(true);
  return <span className="numero">{formatarDuracao(tempoDemanda(demanda, agora), true)}</span>;
}

/** Contador da aba: quando muda, dá um pulso verde, mostrando para onde a tarefa foi (não pulsa ao abrir o app). */
function Contagem({ n }: { n: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const antes = useRef(n);
  useEffect(() => {
    // com uma tarefa voando para esta aba, o pulso fica para a chegada (voo.ts)
    if (antes.current !== n && !ref.current?.closest('[data-chegando]') && !matchMedia('(prefers-reduced-motion: reduce)').matches) pulsarContagem(ref.current);
    antes.current = n;
  }, [n]);
  return <span ref={ref} className="contagem">{n}</span>;
}

export function App() {
  const [estado, setEstado] = useState<Estado | null>(null);
  const [erroCarga, setErroCarga] = useState('');
  const [vista, setVista] = useState<Vista>('a_fazer');
  const painel = useRef<HTMLElement>(null);
  // Troca de pasta: o conteúdo sobe de leve, como a folha puxada da pasta. Anima sem remontar, para não perder os filtros.
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    for (const el of painel.current?.children ?? []) {
      el.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 280, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' });
    }
  }, [vista]);
  const [aberta, setAberta] = useState<string | null>(null);
  const [janela, setJanela] = useState<'nova' | 'config' | 'captura' | null>(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [comemorando, setComemorando] = useState(false);
  const fimComemoracao = useCallback(() => setComemorando(false), []);
  // Desligar (só aberto pelo atalho): o primeiro clique arma, o segundo encerra o app inteiro
  const [desligar, setDesligar] = useState<'nao' | 'confirmar' | 'feito'>('nao');
  useEffect(() => {
    if (desligar !== 'confirmar') return;
    const t = setTimeout(() => setDesligar('nao'), 4000);
    return () => clearTimeout(t);
  }, [desligar]);
  const hoje = diaLocal();

  const carregar = useCallback(async () => {
    try { setEstado(await api.estado()); setErroCarga(''); } catch (e) { setErroCarga(mensagem(e)); }
  }, []);
  useEffect(() => { carregar(); }, [carregar]);

  const tema = estado?.config.tema;
  useEffect(() => {
    if (!tema) return;
    const raiz = document.documentElement;
    raiz.classList.add('sem-transicao');
    raiz.dataset.tema = tema;
    try { localStorage.setItem('donely-tema', tema); } catch { /* sem armazenamento: o tema vem do servidor */ }
    const quadro = requestAnimationFrame(() => requestAnimationFrame(() => raiz.classList.remove('sem-transicao')));
    return () => cancelAnimationFrame(quadro);
  }, [tema]);

  useEffect(() => {
    // Aviso com ação (Desfazer) ou com erro fica até ser fechado.
    if (!aviso || aviso.acao || aviso.erro) return;
    const espera = setTimeout(() => setAviso(null), 3500);
    return () => clearTimeout(espera);
  }, [aviso]);

  useEffect(() => {
    const tecla = (e: globalThis.KeyboardEvent) => {
      const alvo = e.target as HTMLElement;
      if (e.key.toLowerCase() !== 'c' || e.ctrlKey || e.metaKey || e.altKey || janela || aberta) return;
      if (alvo.closest('input, textarea, select, [contenteditable]')) return;
      e.preventDefault();
      setJanela('captura');
    };
    document.addEventListener('keydown', tecla);
    return () => document.removeEventListener('keydown', tecla);
  }, [janela, aberta]);

  const avisar = (texto: string, extra: Partial<Aviso> = {}) => setAviso({ id: Date.now(), texto, ...extra });
  // Mais uma concluída: comemora com a logo animada (quem pediu menos movimento fica só com o aviso).
  const comemorar = () => { if (!matchMedia('(prefers-reduced-motion: reduce)').matches) setComemorando(true); };
  const guardar = (t: Tarefa) => setEstado((e) => e && {
    ...e, tarefas: e.tarefas.some((x) => x.id === t.id) ? e.tarefas.map((x) => (x.id === t.id ? t : x)) : [...e.tarefas, t],
  });

  const acoes: Acoes = useMemo(() => {
    async function tentar<T>(fn: () => Promise<T>): Promise<T | undefined> {
      try { return await fn(); } catch (e) { avisar(mensagem(e), { erro: true }); return undefined; }
    }
    const comTarefa = async (fn: () => Promise<Tarefa>) => { const t = await tentar(fn); if (t) guardar(t); return t; };
    const a: Acoes = {
      criar: (n) => comTarefa(() => api.criar(n)),
      atualizar: async (id, campos) => { await comTarefa(() => api.atualizar(id, campos)); },
      mover: async (id, status) => {
        const antes = estado?.tarefas.find((t) => t.id === id)?.status;
        const t = await comTarefa(() => api.mover(id, status));
        if (!t || !antes || antes === status) return;
        if (status === 'concluido') {
          comemorar();
          const n = estado!.config.arquivarAposDias;
          avisar(`Concluída. ${n === 1 ? 'Amanhã' : `Em ${n} dias`} vai para o Histórico.`, { acao: { rotulo: 'Desfazer', fn: () => a.mover(id, antes) } });
        } else if (antes === 'concluido') {
          avisar(`De volta ao quadro, em ${NOME_STATUS[status]}.`);
        }
      },
      arquivar: async (id) => { if (await comTarefa(() => api.arquivar(id))) avisar('Arquivada no Histórico.'); },
      excluir: async (id) => {
        if (!(await tentar(async () => { await api.excluir(id); return true; }))) return;
        setEstado((e) => e && { ...e, tarefas: e.tarefas.filter((t) => t.id !== id) });
        avisar('Tarefa excluída.');
      },
      adicionarItem: async (id, texto) => { await comTarefa(() => api.adicionarItem(id, texto)); },
      marcarItem: async (id, item, feito) => { await comTarefa(() => api.marcarItem(id, item, feito)); },
      removerItem: async (id, item) => { await comTarefa(() => api.removerItem(id, item)); },
      criarCliente: async (nome) => {
        const c = await tentar(() => api.criarCliente(nome));
        if (c) setEstado((e) => e && { ...e, clientes: [...e.clientes, c].sort((x, y) => x.nome.localeCompare(y.nome, 'pt-BR')) });
        return c;
      },
      // Um arquivo por vez, para mostrar o erro do que falhar sem perder os outros.
      anexar: async (id, arquivos, papel) => { for (const f of arquivos) await comTarefa(() => api.anexar(id, f, papel)); },
      removerAnexo: async (id, anexo) => { await comTarefa(() => api.removerAnexo(id, anexo)); },
      removerCliente: async (id) => {
        if (!(await tentar(async () => { await api.removerCliente(id); return true; }))) return;
        setEstado((e) => e && { ...e, clientes: e.clientes.filter((c) => c.id !== id) });
      },
      salvarConfig: async (campos) => {
        const config = await tentar(() => api.salvarConfig(campos));
        if (config) setEstado((e) => e && { ...e, config });
        return Boolean(config);
      },
      capturar: async (d) => {
        const demandas = await tentar(() => api.capturar(d));
        if (demandas) setEstado((e) => e && { ...e, demandas });
        return Boolean(demandas);
      },
      cronometro: async (id, acao) => {
        const demandas = await tentar(() => api.cronometro(id, acao));
        if (demandas) setEstado((e) => e && { ...e, demandas });
      },
    };
    return a;
  }, [estado, hoje]);

  const emExecucao = estado?.demandas.find((d) => d.iniciadaEm);

  if (desligar === 'feito') {
    return (
      <main className="carregando">
        <img src={logo} alt="" width={56} height={56} />
        <p role="status">DONELY desligado. Pode fechar esta aba.</p>
        <p style={{ color: 'var(--texto-2)' }}>Para abrir de novo, use o atalho na área de trabalho.</p>
      </main>
    );
  }

  if (!estado) {
    return (
      <main className="carregando">
        <img src={logo} alt="" width={56} height={56} />
        {erroCarga
          ? <><p role="alert">{erroCarga}</p><button type="button" className="btn" onClick={carregar}>Tentar de novo</button></>
          : <p style={{ color: "var(--texto-2)" }}>Carregando suas tarefas…</p>}
      </main>
    );
  }

  const tarefaAberta = aberta ? estado.tarefas.find((t) => t.id === aberta) : undefined;
  const noQuadro = estado.tarefas.filter((t) => !estaArquivada(t, estado.config.arquivarAposDias, hoje));
  const abertas = noQuadro.filter((t) => t.status !== 'concluido').length;
  const atrasadas = noQuadro.filter((t) => situacaoPrazo(t, hoje)?.tipo === 'atrasada').length;
  const venceHoje = noQuadro.filter((t) => situacaoPrazo(t, hoje)?.tipo === 'hoje').length;
  const semana = inicioDaSemana(hoje);
  const feitasSemana = estado.tarefas.filter((t) => t.concluidoEm && diaLocal(new Date(t.concluidoEm)) >= semana).length;
  const dataExtenso = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).replace(/^./, (l) => l.toUpperCase());
  const demandasAbertas = estado.demandas.filter((d) => !d.concluidaEm).length;
  const sobreposto = Boolean(tarefaAberta || janela);
  // Abas no padrão do teclado: setas, Home e End trocam de pasta; Tab sai das abas.
  function teclaAbas(e: KeyboardEvent<HTMLDivElement>) {
    const i = ABAS.indexOf(vista);
    const j = ({ ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: ABAS.length - 1 } as Record<string, number>)[e.key];
    if (j === undefined) return;
    e.preventDefault();
    const proxima = ABAS[(j + ABAS.length) % ABAS.length];
    setVista(proxima);
    document.getElementById(`aba-${proxima}`)?.focus();
  }
  // Cada coluna é uma pasta. A tarefa só muda de pasta pelo fluxo: Iniciar e Concluir (e Voltar ao quadro, no Histórico).
  const pastaColuna = (id: Status, nome: string) => (
    <button key={id} id={`aba-${id}`} type="button" role="tab" aria-selected={vista === id} aria-controls="painel" tabIndex={vista === id ? 0 : -1}
      className={`pasta ${vista === id ? 'ativa' : ''}`} onClick={() => setVista(id)}>
      <span className={`ponto ponto-${id}`} /><span>{nome}</span><Contagem n={noQuadro.filter((t) => t.status === id).length} />
    </button>
  );

  return (
    <>
      <div className="faixa" inert={sobreposto}><div className="faixa-conteudo">
      <header className="topo">
        <div className="marca"><img src={logo} alt="" width={30} height={30} /><span>DONELY</span></div>
        {/* título, data e resumo na mesma linha da marca: a altura fica para a lista de tarefas */}
        <div className="titulo-pagina"><h1>Minhas tarefas</h1><p>{dataExtenso}</p></div>
        <ul className="indicadores" aria-label="Resumo">
            <li><strong>{abertas}</strong>{abertas === 1 ? 'aberta' : 'abertas'}</li>
            <li className={atrasadas ? 'alerta' : ''}><strong>{atrasadas}</strong>{atrasadas === 1 ? 'atrasada' : 'atrasadas'}</li>
            <li className={venceHoje ? 'atencao' : ''}><strong>{venceHoje}</strong>{venceHoje === 1 ? 'vence hoje' : 'vencem hoje'}</li>
            <li className="ok"><strong>{feitasSemana}</strong>{feitasSemana === 1 ? 'feita' : 'feitas'} na semana</li>
          </ul>
        <div className="topo-acoes">
          {emExecucao && (
            <span className="cronometro">
              <button type="button" className="cronometro-ir" onClick={() => setVista('demandas')} title="Ver em Não planejadas">
                <span className="pulso" aria-hidden="true" /><span className="cronometro-desc">{emExecucao.descricao}</span>
                <TempoCorrendo demanda={emExecucao} />
              </button>
              <button type="button" className="btn icone-so" onClick={() => acoes.cronometro(emExecucao.id, 'pausar')} aria-label={`Pausar ${emExecucao.descricao}`}><Icone nome="pausa" tamanho={15} /></button>
            </span>
          )}
          <button type="button" className="btn captura" onClick={() => setJanela('captura')} aria-keyshortcuts="C" title="Captura rápida (tecla C)">
            <Icone nome="raio" />Captura rápida<kbd>C</kbd>
          </button>
          <button type="button" className="btn redondo" onClick={() => setJanela('config')} aria-label="Configurações" title="Configurações"><Icone nome="ajustes" tamanho={18} /></button>
          {estado.desligavel && (
            <button type="button" className={`btn redondo desligar ${desligar === 'confirmar' ? 'confirmando' : ''}`} onBlur={() => setDesligar((d) => (d === 'confirmar' ? 'nao' : d))}
              aria-label={desligar === 'confirmar' ? 'Confirmar: desligar o DONELY' : 'Desligar o DONELY'} title={desligar === 'confirmar' ? 'Clique de novo para desligar' : 'Desligar'}
              onClick={async () => {
                if (desligar !== 'confirmar') { setDesligar('confirmar'); return; }
                try { await api.desligar(); setDesligar('feito'); } catch (e) { setDesligar('nao'); avisar(mensagem(e), { erro: true }); }
              }}>
              <Icone nome="desligar" tamanho={18} />{desligar === 'confirmar' && <span>Desligar?</span>}
            </button>
          )}
        </div>
      </header>
        <div className="pastas" role="tablist" aria-label="Seções" onKeyDown={teclaAbas}>
          {COLUNAS.map((c) => pastaColuna(c.id, c.nome))}
          <button id="aba-demandas" type="button" role="tab" aria-selected={vista === 'demandas'} aria-controls="painel" tabIndex={vista === 'demandas' ? 0 : -1} className={`pasta direita pasta-demandas ${vista === 'demandas' ? 'ativa' : ''}`} onClick={() => setVista('demandas')}>
            <Icone nome="raio" /><span>Não planejadas</span><Contagem n={demandasAbertas} />
          </button>
          <button id="aba-historico" type="button" role="tab" aria-selected={vista === 'historico'} aria-controls="painel" tabIndex={vista === 'historico' ? 0 : -1} className={`pasta espelhada ${vista === 'historico' ? 'ativa' : ''}`} onClick={() => setVista('historico')}>
            <Icone nome="arquivo" /><span>Histórico</span>
          </button>
        </div>
      </div></div>
      <main className="pagina" inert={sobreposto}>
        <section ref={painel} id="painel" className="cartao-principal" role="tabpanel" aria-labelledby={`aba-${vista}`}>
          {vista === 'demandas' ? <Demandas demandas={estado.demandas} hoje={hoje} acoes={acoes} onCapturar={() => setJanela('captura')} />
            : vista === 'historico'
            ? <Historico tarefas={estado.tarefas} demandas={estado.demandas} hoje={hoje} acoes={acoes} onAbrir={setAberta} onAviso={avisar} />
            : <Quadro coluna={vista} tarefas={estado.tarefas} config={estado.config} hoje={hoje} acoes={acoes} onAbrir={setAberta} onConfig={() => setJanela('config')} onNova={() => setJanela('nova')} />}
        </section>
      </main>

      {tarefaAberta && <ModalTarefa tarefa={tarefaAberta} config={estado.config} clientes={estado.clientes} hoje={hoje} acoes={acoes} onFechar={() => setAberta(null)} />}
      {comemorando && <Comemoracao onFim={fimComemoracao} />}
      {janela === 'nova' && <ModalNova hoje={hoje} config={estado.config} clientes={estado.clientes} acoes={acoes} onFechar={() => setJanela(null)}
        onCriada={() => { setJanela(null); setVista('a_fazer'); avisar('Tarefa criada em A fazer.'); }} />}
      {janela === 'captura' && <CapturaRapida demandas={estado.demandas} acoes={acoes} onFechar={() => setJanela(null)}
        onCapturada={() => { setJanela(null); avisar('Demanda capturada em Não planejadas.'); }} />}
      {janela === 'config' && <Configuracoes config={estado.config} clientes={estado.clientes} acoes={acoes} atalho={estado.atalho} onFechar={() => setJanela(null)} />}

      {/* A região existe antes do texto, para o leitor de tela anunciar cada aviso. */}
      <div role="status">
        {aviso && (
          <div key={aviso.id} className={`aviso ${aviso.erro ? 'aviso-erro' : ''}`}>
            <Icone nome={aviso.erro ? 'alerta' : 'check'} />
            <span>{aviso.texto}</span>
            {aviso.acao && <button type="button" onClick={() => { setAviso(null); aviso.acao!.fn(); }}>{aviso.acao.rotulo}</button>}
            {(aviso.acao || aviso.erro) && <button type="button" className="aviso-fechar" onClick={() => setAviso(null)} aria-label="Fechar aviso"><Icone nome="x" tamanho={14} /></button>}
          </div>
        )}
      </div>
    </>
  );
}
