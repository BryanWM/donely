import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import logo from '../../../brand/donely-icone.svg';
import { COLUNAS, diaLocal, estaArquivada, formatarDuracao, inicioDaSemana, NOME_STATUS, situacaoPrazo, tempoDemanda, type Demanda, type InfoVersao, type Status, type Tarefa } from '../shared/dominio';
import type { Acoes } from './acoes';
import { api, type Estado } from './api';
import { Caderno, type SecaoCaderno } from './componentes/Caderno';
import { Comemoracao } from './componentes/Comemoracao';
import { definirDicaDiaria, dicaDiariaLigada } from './dicas';
import { pulsarContagem } from './voo';
import { CapturaRapida } from './componentes/CapturaRapida';
import { Configuracoes, type AbaConfig } from './componentes/Configuracoes';
import { Historico } from './componentes/Historico';
import { Modal } from './componentes/Modal';
import { Demandas, useAgora } from './componentes/Demandas';
import { Icone } from './componentes/Icone';
import { ModalNova } from './componentes/ModalNova';
import { ModalNovaRapida } from './componentes/ModalNovaRapida';
import { ModalTarefaRapida } from './componentes/ModalTarefaRapida';
import { EscolhaCard } from './componentes/EscolhaCard';
import { ModalTarefa } from './componentes/ModalTarefa';
import { Quadro } from './componentes/Quadro';

interface Aviso { id: number; texto: string; erro?: boolean; acao?: { rotulo: string; fn: () => void }; acaoSecundaria?: { rotulo: string; fn: () => void } }
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

type Terminal = 'wsl' | 'linux' | 'macos' | 'cmd' | 'powershell';
const TERMINAIS: { id: Terminal; nome: string; onde: string }[] = [
  { id: 'wsl', nome: 'WSL', onde: 'No terminal do WSL (Ubuntu)' },
  { id: 'linux', nome: 'Linux', onde: 'No terminal' },
  { id: 'macos', nome: 'macOS', onde: 'No app Terminal' },
  { id: 'cmd', nome: 'CMD', onde: 'No Prompt de Comando (cmd)' },
  { id: 'powershell', nome: 'PowerShell', onde: 'No PowerShell' },
];

/** Atualizar = baixar a main (git pull) e instalar as dependências novas, na pasta do DONELY. */
function comandoAtualizar(terminal: Terminal, pasta: string) {
  // cmd: /d troca de drive junto (C: para D:). PowerShell 5.1 não tem &&: if ($?) só segue se o git pull deu certo.
  if (terminal === 'cmd') return `cd /d "${pasta}" && git pull && cd app && npm install`;
  if (terminal === 'powershell') return `cd "${pasta}"; git pull; if ($?) { cd app; npm install }`;
  return `cd "${pasta}" && git pull && cd app && npm install`;
}

/** O que mudou na main e o passo a passo para atualizar: o código vem do GitHub; os dados (app/dados) ficam fora do git e não mudam. */
function AtualizarVersao({ info, desligavel, onAviso }: { info: InfoVersao; desligavel: boolean; onAviso: (texto: string) => void }) {
  // começa no terminal que o servidor sugere (Windows sem WSL: PowerShell); a pessoa troca se usar outro
  const [terminal, setTerminal] = useState<Terminal>(info.sistema === 'windows' ? 'powershell' : info.sistema ?? 'wsl');
  const { onde } = TERMINAIS.find((t) => t.id === terminal)!;
  const comando = comandoAtualizar(terminal, info.pasta ?? '');
  const copiar = async () => {
    try { await navigator.clipboard.writeText(comando); onAviso(`Comando copiado. Cole ${onde.charAt(0).toLowerCase()}${onde.slice(1)}.`); }
    catch { onAviso('O navegador não deixou copiar. Selecione o comando e copie à mão.'); }
  };
  const alteracoes = info.alteracoes ?? [];
  const faltam = info.faltam ?? alteracoes.length;
  return (
    <div className="atualizar-versao">
      <p>
        Sua versão do DONELY está desatualizada: você tem a <strong>ver. {info.atual}</strong>
        {info.disponivel && info.disponivel !== info.atual ? <>, e a branch <code>main</code> do GitHub já está na <strong>ver. {info.disponivel}</strong></> : null}.
        {' '}A <code>main</code> tem {faltam === 1 ? '1 alteração' : `${faltam} alterações`} que esta cópia ainda não tem.
      </p>
      {alteracoes.length > 0 && (
        <ul className="versao-alteracoes">
          {alteracoes.map((a) => <li key={a.hash}><code>{a.hash}</code>{a.titulo}</li>)}
          {faltam > alteracoes.length && <li className="sem-valor">e mais {faltam - alteracoes.length}</li>}
        </ul>
      )}
      <p>Para atualizar o DONELY, siga os passos abaixo. Seus dados não mudam: ficam em <code>app/dados</code>, fora do git.</p>
      <div className="terminal-escolha">
        <span>Onde você roda o DONELY:</span>
        <div className="segmentado" role="radiogroup" aria-label="Sistema ou terminal">
          {TERMINAIS.map((t) => (
            <button key={t.id} type="button" role="radio" aria-checked={terminal === t.id} className={terminal === t.id ? 'ativo' : ''} onClick={() => setTerminal(t.id)}>{t.nome}</button>
          ))}
        </div>
      </div>
      <ol>
        <li>{desligavel ? <>Desligue o DONELY (botão <strong>Desligar</strong>, no topo).</> : <>Pare o DONELY no terminal com <kbd>Ctrl</kbd>+<kbd>C</kbd>.</>}</li>
        <li>{onde}, rode:
          <span className="comando"><code>{comando}</code><button type="button" className="btn texto pequeno" onClick={copiar}>Copiar</button></span>
        </li>
        <li>Abra o DONELY de novo{desligavel ? ' pelo atalho' : ''}.</li>
      </ol>
    </div>
  );
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
  const [janela, setJanela] = useState<'escolher' | 'nova' | 'rapida' | 'config' | 'captura' | 'versao' | 'caderno' | null>(null);
  // aba que as Configurações abrem: a dica do dia abre em Dicas
  const [abaConfig, setAbaConfig] = useState<AbaConfig>('tarefas');
  const abrirConfig = (aba: AbaConfig = 'tarefas') => { setAbaConfig(aba); setJanela('config'); };
  // última área do Caderno usada (Pessoas ou Ideias): vale enquanto o app estiver aberto
  const [secaoCaderno, setSecaoCaderno] = useState<SecaoCaderno>('pessoas');
  // pasta do projeto quando o repositório tem versão nova (mostra o botão de atualização no topo)
  const [infoVersao, setInfoVersao] = useState<InfoVersao | null>(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  // saindo: o aviso faz a saída animada antes de sair do DOM; pausado: o mouse está em cima dele
  const [saindo, setSaindo] = useState(false);
  const [pausado, setPausado] = useState(false);
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

  // Versão: o servidor confere a main ao iniciar e a cada hora; a interface pergunta o resultado ao abrir e a cada 2 minutos
  // (a primeira conferência pode terminar depois que a página abriu). Avisa uma vez por sessão; o alerta do topo fica.
  useEffect(() => {
    let avisou = false;
    const conferir = async () => {
      try {
        const r = await api.versao();
        setInfoVersao(r);
        if (r.desatualizada && !avisou) { avisou = true; avisar('Há uma atualização do DONELY disponível.', { acao: { rotulo: 'Ver detalhes', fn: () => setJanela('versao') } }); }
      } catch { /* sem servidor: tenta na próxima */ }
    };
    conferir();
    const i = setInterval(conferir, 120_000);
    return () => clearInterval(i);
  }, []);

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
    // Some sozinho em todos os casos; com ação (Desfazer) ou erro, fica um pouco mais para dar tempo de ler e clicar.
    if (!aviso || saindo || pausado) return;
    const espera = setTimeout(() => setSaindo(true), aviso.acao ? 8000 : aviso.erro ? 6000 : 3500);
    return () => clearTimeout(espera);
  }, [aviso, saindo, pausado]);

  useEffect(() => {
    // a saída dura o tempo da animação (250 ms); não depende de animationend, que não dispara com movimento reduzido
    if (!saindo) return;
    const fim = setTimeout(() => { setAviso(null); setSaindo(false); setPausado(false); }, 250);
    return () => clearTimeout(fim);
  }, [saindo]);

  useEffect(() => {
    const tecla = (e: globalThis.KeyboardEvent) => {
      const alvo = e.target as HTMLElement;
      // C = Captura rápida, N = Caderno; nunca enquanto se digita ou com outra janela aberta
      const atalho = ({ c: 'captura', n: 'caderno' } as const)[e.key.toLowerCase() as 'c' | 'n'];
      if (!atalho || e.ctrlKey || e.metaKey || e.altKey || janela || aberta) return;
      if (alvo.closest('input, textarea, select, [contenteditable]')) return;
      e.preventDefault();
      setJanela(atalho);
    };
    document.addEventListener('keydown', tecla);
    return () => document.removeEventListener('keydown', tecla);
  }, [janela, aberta]);

  const avisar = (texto: string, extra: Partial<Aviso> = {}) => { setSaindo(false); setAviso({ id: Date.now(), texto, ...extra }); };

  // Dica do dia: uma vez por dia, na primeira carga da página. O dia fica no navegador, sem gravar nada no servidor.
  const dicaChecada = useRef(false);
  useEffect(() => {
    // espera a resposta da versão: com atualização pendente, o aviso dela tem a vez e a dica fica para outra abertura
    if (!estado || !infoVersao || dicaChecada.current) return;
    dicaChecada.current = true;
    if (infoVersao.desatualizada || !dicaDiariaLigada()) return;
    try {
      if (localStorage.getItem('donely-dica') === hoje) return;
      localStorage.setItem('donely-dica', hoje);
    } catch { return; }
    avisar('Dica: use uma IA gratuita para organizar ideias, conversas e tarefas.', {
      acao: { rotulo: 'Ver dica', fn: () => abrirConfig('dicas') },
      acaoSecundaria: { rotulo: 'Não exibir novamente', fn: () => definirDicaDiaria(false) },
    });
  }, [estado, infoVersao, hoje]);
  const fecharAviso = () => setSaindo(true);
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
      editarItem: async (id, item, texto) => { await comTarefa(() => api.editarItem(id, item, texto)); },
      removerItem: async (id, item) => { await comTarefa(() => api.removerItem(id, item)); },
      criarCliente: async (nome) => {
        const c = await tentar(() => api.criarCliente(nome));
        if (c) setEstado((e) => e && { ...e, clientes: [...e.clientes, c].sort((x, y) => x.nome.localeCompare(y.nome, 'pt-BR')) });
        return c;
      },
      // Um arquivo por vez, para mostrar o erro do que falhar sem perder os outros.
      anexar: async (id, arquivos, papel) => { for (const f of arquivos) await comTarefa(() => api.anexar(id, f, papel)); },
      anexarLink: async (id, url, papel) => Boolean(await comTarefa(() => api.anexarLink(id, url, papel))),
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
      registroDemanda: async (id, registro, finalizar) => {
        const demandas = await tentar(() => api.registroDemanda(id, registro, finalizar));
        if (demandas) setEstado((e) => e && { ...e, demandas });
        return Boolean(demandas);
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
        <div className="marca"><img src={logo} alt="" width={30} height={30} /><span>DONELY</span>{infoVersao?.atual && <small className="versao-app">ver. {infoVersao.atual}</small>}</div>
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
            <Icone nome="raio" /><span className="rotulo-btn">Captura rápida</span><kbd>C</kbd>
          </button>
          <button type="button" className="btn captura" onClick={() => setJanela('caderno')} aria-keyshortcuts="N" title="Caderno: pessoas e ideias (tecla N)">
            <Icone nome="notas" /><span className="rotulo-btn">Caderno</span><kbd>N</kbd>
          </button>
          {infoVersao?.desatualizada && (
            <button type="button" className="btn redondo atualizar" onClick={() => setJanela('versao')} aria-label="Atualização do DONELY disponível: ver detalhes" title="Atualização disponível">
              <Icone nome="alerta" tamanho={18} />
            </button>
          )}
          <button type="button" className="btn redondo" onClick={() => abrirConfig()} aria-label="Configurações" title="Configurações"><Icone nome="ajustes" tamanho={18} /></button>
          {estado.desligavel && (
            <button type="button" className={`btn redondo desligar ${desligar === 'confirmar' ? 'confirmando' : ''}`} onBlur={() => setDesligar((d) => (d === 'confirmar' ? 'nao' : d))}
              aria-label={desligar === 'confirmar' ? 'Confirmar: desligar o DONELY' : 'Desligar o DONELY'} title={desligar === 'confirmar' ? 'Clique de novo para desligar' : 'Desligar'}
              onClick={async () => {
                if (desligar !== 'confirmar') { setDesligar('confirmar'); return; }
                try { await api.desligar(); setDesligar('feito'); } catch (e) { setDesligar('nao'); avisar(mensagem(e), { erro: true }); }
              }}>
              <Icone nome="desligar" tamanho={18} />
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
            : <Quadro coluna={vista} tarefas={estado.tarefas} config={estado.config} hoje={hoje} acoes={acoes} onAbrir={setAberta} onConfig={() => abrirConfig()} onNova={() => setJanela('escolher')} />}
        </section>
      </main>

      {tarefaAberta && tarefaAberta.modelo === 'rapido' && <ModalTarefaRapida tarefa={tarefaAberta} config={estado.config} hoje={hoje} acoes={acoes} onFechar={() => setAberta(null)} />}
      {tarefaAberta && tarefaAberta.modelo !== 'rapido' && <ModalTarefa tarefa={tarefaAberta} config={estado.config} clientes={estado.clientes} hoje={hoje} acoes={acoes} onFechar={() => setAberta(null)} />}
      {comemorando && <Comemoracao onFim={fimComemoracao} />}
      {janela === 'escolher' && <EscolhaCard onEscolher={(modelo) => setJanela(modelo === 'rapido' ? 'rapida' : 'nova')} onFechar={() => setJanela(null)} />}
      {janela === 'rapida' && <ModalNovaRapida hoje={hoje} config={estado.config} acoes={acoes} onFechar={() => setJanela(null)}
        onCriada={() => { setJanela(null); setVista('a_fazer'); avisar('Card rápido criado em A fazer.'); }} />}
      {janela === 'nova' && <ModalNova hoje={hoje} config={estado.config} clientes={estado.clientes} acoes={acoes} onFechar={() => setJanela(null)}
        onCriada={() => { setJanela(null); setVista('a_fazer'); avisar('Tarefa criada em A fazer.'); }} />}
      {janela === 'captura' && <CapturaRapida demandas={estado.demandas} ocultas={estado.config.origensOcultas} acoes={acoes} onFechar={() => setJanela(null)}
        onCapturada={() => { setJanela(null); avisar('Demanda capturada em Não planejadas.'); }} />}
      {janela === 'caderno' && <Caderno secao={secaoCaderno} onSecao={setSecaoCaderno} hoje={hoje} tarefas={estado.tarefas} clientes={estado.clientes} acoes={acoes}
        onAbrirTarefa={setAberta} onAviso={avisar} onFechar={() => setJanela(null)} />}
      {janela === 'versao' && (
        <Modal titulo="Atualização disponível" onFechar={() => setJanela(null)}>
          {infoVersao && <AtualizarVersao info={infoVersao} desligavel={estado.desligavel} onAviso={avisar} />}
        </Modal>
      )}
      {janela === 'config' && <Configuracoes config={estado.config} clientes={estado.clientes} acoes={acoes} atalho={estado.atalho} abaInicial={abaConfig} onFechar={() => setJanela(null)} />}

      {/* A região existe antes do texto, para o leitor de tela anunciar cada aviso. */}
      <div role="status">
        {aviso && (
          <div key={aviso.id} className={`aviso ${aviso.erro ? 'aviso-erro' : ''} ${saindo ? 'saindo' : ''}`}
            onMouseEnter={() => setPausado(true)} onMouseLeave={() => setPausado(false)}>
            <Icone nome={aviso.erro ? 'alerta' : 'check'} />
            <span>{aviso.texto}</span>
            {aviso.acao && <button type="button" onClick={() => { fecharAviso(); aviso.acao!.fn(); }}>{aviso.acao.rotulo}</button>}
            {aviso.acaoSecundaria && <button type="button" className="aviso-secundaria" onClick={() => { fecharAviso(); aviso.acaoSecundaria!.fn(); }}>{aviso.acaoSecundaria.rotulo}</button>}
            <button type="button" className="aviso-fechar" onClick={fecharAviso} aria-label="Fechar aviso"><Icone nome="x" tamanho={14} /></button>
          </div>
        )}
      </div>
    </>
  );
}
