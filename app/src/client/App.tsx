import { useCallback, useEffect, useMemo, useState } from 'react';
import logo from '../../../brand/donely-icone.svg';
import { COLUNAS, diaLocal, estaArquivada, inicioDaSemana, NOME_STATUS, situacaoPrazo, type Status, type Tarefa } from '../shared/dominio';
import type { Acoes } from './acoes';
import { api, type Estado } from './api';
import { Configuracoes } from './componentes/Configuracoes';
import { Feitas } from './componentes/Feitas';
import { Icone } from './componentes/Icone';
import { ModalNova } from './componentes/ModalNova';
import { ModalTarefa } from './componentes/ModalTarefa';
import { Quadro } from './componentes/Quadro';

interface Aviso { id: number; texto: string; erro?: boolean; acao?: { rotulo: string; fn: () => void } }
const mensagem = (e: unknown) => (e instanceof Error ? e.message : 'Algo deu errado. Tente de novo.');

export function App() {
  const [estado, setEstado] = useState<Estado | null>(null);
  const [erroCarga, setErroCarga] = useState('');
  const [vista, setVista] = useState<Status | 'feitas'>('a_fazer');
  const [pastaSobre, setPastaSobre] = useState<Status | null>(null);
  const [aberta, setAberta] = useState<string | null>(null);
  const [janela, setJanela] = useState<'nova' | 'config' | null>(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const hoje = diaLocal();

  const carregar = useCallback(async () => {
    try { setEstado(await api.estado()); setErroCarga(''); } catch (e) { setErroCarga(mensagem(e)); }
  }, []);
  useEffect(() => { carregar(); }, [carregar]);
  const tema = estado?.config.tema;
  useEffect(() => { if (tema) document.documentElement.dataset.tema = tema; }, [tema]);

  useEffect(() => {
    if (!aviso) return;
    const espera = setTimeout(() => setAviso(null), aviso.acao ? 6000 : 3500);
    return () => clearTimeout(espera);
  }, [aviso]);

  const avisar = (texto: string, extra: Partial<Aviso> = {}) => setAviso({ id: Date.now(), texto, ...extra });
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
          const n = estado!.config.arquivarAposDias;
          avisar(`Concluída. ${n === 1 ? 'Amanhã' : `Em ${n} dias`} vai para Tarefas feitas.`, { acao: { rotulo: 'Desfazer', fn: () => a.mover(id, antes) } });
        } else if (antes === 'concluido') {
          avisar(`De volta ao quadro, em ${NOME_STATUS[status]}.`);
        }
      },
      arquivar: async (id) => { if (await comTarefa(() => api.arquivar(id))) avisar('Arquivada em Tarefas feitas.'); },
      excluir: async (id) => {
        if (!(await tentar(async () => { await api.excluir(id); return true; }))) return;
        setEstado((e) => e && { ...e, tarefas: e.tarefas.filter((t) => t.id !== id) });
        avisar('Tarefa excluída.');
      },
      adicionarItem: async (id, texto) => { await comTarefa(() => api.adicionarItem(id, texto)); },
      marcarItem: async (id, item, feito) => { await comTarefa(() => api.marcarItem(id, item, feito)); },
      removerItem: async (id, item) => { await comTarefa(() => api.removerItem(id, item)); },
      adicionarLink: async (id, url, rotulo) => Boolean(await comTarefa(() => api.adicionarLink(id, url, rotulo))),
      removerLink: async (id, link) => { await comTarefa(() => api.removerLink(id, link)); },
      criarCliente: async (nome, baseUrl) => {
        const c = await tentar(() => api.criarCliente(nome, baseUrl));
        if (c) setEstado((e) => e && { ...e, clientes: [...e.clientes, c].sort((x, y) => x.nome.localeCompare(y.nome, 'pt-BR')) });
        return c;
      },
      removerCliente: async (id) => {
        if (!(await tentar(async () => { await api.removerCliente(id); return true; }))) return;
        setEstado((e) => e && { ...e, clientes: e.clientes.filter((c) => c.id !== id) });
      },
      salvarConfig: async (campos) => {
        const config = await tentar(() => api.salvarConfig(campos));
        if (config) setEstado((e) => e && { ...e, config });
      },
    };
    return a;
  }, [estado, hoje]);

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
  const nFeitas = estado.tarefas.length - noQuadro.length;
  const abertas = noQuadro.filter((t) => t.status !== 'concluido').length;
  const atrasadas = noQuadro.filter((t) => situacaoPrazo(t, hoje)?.tipo === 'atrasada').length;
  const venceHoje = noQuadro.filter((t) => situacaoPrazo(t, hoje)?.tipo === 'hoje').length;
  const semana = inicioDaSemana(hoje);
  const feitasSemana = estado.tarefas.filter((t) => t.concluidoEm && diaLocal(new Date(t.concluidoEm)) >= semana).length;
  const dataExtenso = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).replace(/^./, (l) => l.toUpperCase());
  // Cada coluna é uma pasta. Soltar um card sobre a pasta move a tarefa para ela.
  const pastaColuna = (id: Status, nome: string) => (
    <button key={id} type="button" role="tab" aria-selected={vista === id}
      className={`pasta ${vista === id ? 'ativa' : ''} ${pastaSobre === id ? 'sobre' : ''}`} onClick={() => setVista(id)}
      onDragOver={(e) => { e.preventDefault(); setPastaSobre(id); }}
      onDragLeave={() => setPastaSobre(null)}
      onDrop={(e) => { e.preventDefault(); setPastaSobre(null); const t = e.dataTransfer.getData('text/plain'); if (t) acoes.mover(t, id); }}>
      <span className={`ponto ponto-${id}`} /><span>{nome}</span><span className="contagem">{noQuadro.filter((t) => t.status === id).length}</span>
    </button>
  );

  return (
    <>
      <div className="faixa"><div className="faixa-conteudo">
      <header className="topo">
        <div className="marca"><img src={logo} alt="" width={30} height={30} /><span>DONELY</span></div>
        <div className="topo-acoes">
          <button type="button" className="btn redondo" onClick={() => setJanela('config')} aria-label="Configurações" title="Configurações"><Icone nome="ajustes" tamanho={18} /></button>
        </div>
      </header>
        <div className="cabecalho">
          <div>
            <h1>Minhas tarefas</h1>
            <p>{dataExtenso}</p>
          </div>
          <ul className="indicadores" aria-label="Resumo">
            <li><strong>{abertas}</strong>{abertas === 1 ? 'aberta' : 'abertas'}</li>
            <li className={atrasadas ? 'alerta' : ''}><strong>{atrasadas}</strong>{atrasadas === 1 ? 'atrasada' : 'atrasadas'}</li>
            <li className={venceHoje ? 'atencao' : ''}><strong>{venceHoje}</strong>{venceHoje === 1 ? 'vence hoje' : 'vencem hoje'}</li>
            <li className="ok"><strong>{feitasSemana}</strong>{feitasSemana === 1 ? 'feita' : 'feitas'} na semana</li>
          </ul>
        </div>
        <div className="pastas" role="tablist" aria-label="Seções">
          {COLUNAS.map((c) => pastaColuna(c.id, c.nome))}
          <button type="button" role="tab" aria-selected={vista === 'feitas'} className={`pasta direita ${vista === 'feitas' ? 'ativa' : ''}`} onClick={() => setVista('feitas')}>
            <Icone nome="arquivo" /><span>Tarefas feitas</span><span className="contagem">{nFeitas}</span>
          </button>
        </div>
      </div></div>
      <main className="pagina">
        <section className="cartao-principal" role="tabpanel">
          {vista === 'feitas'
            ? <Feitas tarefas={estado.tarefas} config={estado.config} hoje={hoje} acoes={acoes} onAbrir={setAberta} />
            : <Quadro coluna={vista} tarefas={estado.tarefas} config={estado.config} hoje={hoje} acoes={acoes} onAbrir={setAberta} onConfig={() => setJanela('config')} onNova={() => setJanela('nova')} />}
        </section>
      </main>

      {tarefaAberta && <ModalTarefa tarefa={tarefaAberta} config={estado.config} clientes={estado.clientes} hoje={hoje} acoes={acoes} onFechar={() => setAberta(null)} />}
      {janela === 'nova' && <ModalNova config={estado.config} clientes={estado.clientes} acoes={acoes} onFechar={() => setJanela(null)}
        onCriada={() => { setJanela(null); setVista('a_fazer'); avisar('Tarefa criada em A fazer.'); }} />}
      {janela === 'config' && <Configuracoes config={estado.config} clientes={estado.clientes} acoes={acoes} onFechar={() => setJanela(null)} />}

      {aviso && (
        <div key={aviso.id} className={`aviso ${aviso.erro ? 'aviso-erro' : ''}`} role={aviso.erro ? 'alert' : 'status'}>
          <Icone nome={aviso.erro ? 'alerta' : 'check'} />
          <span>{aviso.texto}</span>
          {aviso.acao && <button type="button" onClick={() => { setAviso(null); aviso.acao!.fn(); }}>{aviso.acao.rotulo}</button>}
        </div>
      )}
    </>
  );
}
