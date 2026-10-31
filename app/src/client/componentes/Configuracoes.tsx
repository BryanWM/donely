import { useState, type FormEvent } from 'react';
import { OPCOES_ARQUIVAR, type Cliente, type Config, type Tema } from '../../shared/dominio';
import type { Acoes } from '../acoes';
import { api } from '../api';
import { DicasIA } from './DicasIA';
import { Icone } from './Icone';
import { Modal } from './Modal';

export type AbaConfig = 'tarefas' | 'aparencia' | 'clientes' | 'tipos' | 'atalho' | 'dicas';

interface Props {
  config: Config; clientes: Cliente[]; acoes: Acoes; onFechar: () => void; /** No WSL: mostra a seção "Atalho" com "Criar atalho na área de trabalho". */ atalho: boolean;
  /** Seção que abre primeiro (a dica do dia abre em Dicas). */
  abaInicial?: AbaConfig;
}

const TEMAS: [Tema, string][] = [['claro', 'Claro'], ['escuro', 'Escuro'], ['auto', 'Automático']];
const DESCRICOES: Record<AbaConfig, string> = {
  tarefas: 'Quanto tempo uma tarefa concluída fica no quadro antes de ir para o Histórico.',
  aparencia: 'Claro, escuro, ou seguir o tema do aparelho.',
  clientes: 'Aparecem na Nova tarefa de Projeto e no filtro da lista. Cliente é opcional em cada tarefa.',
  tipos: 'Os tipos de entrega que você escolhe ao criar uma tarefa de Projeto.',
  atalho: 'Abre o DONELY com um clique, sem precisar do terminal.',
  dicas: 'Prompts para organizar ideias, conversas e tarefas com uma IA gratuita.',
};

export function Configuracoes({ config, clientes, acoes, onFechar, atalho, abaInicial = 'tarefas' }: Props) {
  const [secao, setSecao] = useState<AbaConfig>(abaInicial);
  const [criandoAtalho, setCriandoAtalho] = useState(false);
  const [resultadoAtalho, setResultadoAtalho] = useState<{ texto: string; erro?: boolean } | null>(null);
  const [cliente, setCliente] = useState('');
  const [tipo, setTipo] = useState('');

  const secoes: [AbaConfig, string][] = [
    ['tarefas', 'Tarefas'],
    ['aparencia', 'Aparência'],
    ['clientes', 'Clientes'],
    ['tipos', 'Tipos de tarefa'],
    ...(atalho ? [['atalho', 'Atalho'] as [AbaConfig, string]] : []),
    ['dicas', 'Dicas de IA'],
  ];
  const titulo = secoes.find(([k]) => k === secao)?.[1] ?? '';

  async function criarAtalho() {
    setCriandoAtalho(true); setResultadoAtalho(null);
    try { const { caminho } = await api.criarAtalho(); setResultadoAtalho({ texto: `Pronto: o atalho DONELY está na área de trabalho (${caminho}).` }); }
    catch (e) { setResultadoAtalho({ texto: e instanceof Error ? e.message : 'Não foi possível criar o atalho.', erro: true }); }
    finally { setCriandoAtalho(false); }
  }

  async function addCliente(e: FormEvent) {
    e.preventDefault();
    if (!cliente.trim()) return;
    if (await acoes.criarCliente(cliente.trim())) setCliente('');
  }

  async function addTipo(e: FormEvent) {
    e.preventDefault();
    const v = tipo.trim();
    if (!v) return;
    if (!config.tipos.includes(v)) await acoes.salvarConfig({ tipos: [...config.tipos, v] });
    setTipo('');
  }

  function conteudo() {
    switch (secao) {
      case 'tarefas':
        return (
          <section className="grupo-ios">
            <ul className="lista-ios">
              <li className="linha-ios">
                <span className="rotulo">Arquivar concluídas</span>
                <div className="segmentado" role="radiogroup" aria-label="Arquivar concluídas">
                  {OPCOES_ARQUIVAR.map((n) => (
                    <button key={n} type="button" role="radio" aria-checked={config.arquivarAposDias === n} className={config.arquivarAposDias === n ? 'ativo' : ''}
                      onClick={() => acoes.salvarConfig({ arquivarAposDias: n })}>{n === 1 ? '1 dia' : `${n} dias`}</button>
                  ))}
                </div>
              </li>
            </ul>
          </section>
        );
      case 'aparencia':
        return (
          <section className="grupo-ios">
            <ul className="lista-ios">
              <li className="linha-ios">
                <span className="rotulo">Tema</span>
                <div className="segmentado" role="radiogroup" aria-label="Tema">
                  {TEMAS.map(([k, n]) => (
                    <button key={k} type="button" role="radio" aria-checked={config.tema === k} className={config.tema === k ? 'ativo' : ''}
                      onClick={() => acoes.salvarConfig({ tema: k })}>{n}</button>
                  ))}
                </div>
              </li>
            </ul>
          </section>
        );
      case 'clientes':
        return (
          <section className="grupo-ios">
            <div className="lista-ios">
              <ul className="lista-ios">
                {clientes.map((c) => (
                  <li key={c.id} className="linha-ios">
                    <span className="rotulo">{c.nome}</span>
                    <button type="button" className="btn icone-so" onClick={() => acoes.removerCliente(c.id)} aria-label={`Remover ${c.nome}`}><Icone nome="x" tamanho={14} /></button>
                  </li>
                ))}
              </ul>
              <form className="linha-adicionar" onSubmit={addCliente}>
                <label className="sr" htmlFor="cfg-cliente">Nome do cliente</label>
                <input id="cfg-cliente" required value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Novo cliente" />
                <button type="submit" className="btn texto pequeno">Adicionar</button>
              </form>
            </div>
          </section>
        );
      case 'tipos':
        return (
          <section className="grupo-ios">
            <div className="lista-ios">
              <div className="chips-editaveis">
                {config.tipos.map((x) => (
                  <span key={x} className="chip">{x}
                    <button type="button" onClick={() => acoes.salvarConfig({ tipos: config.tipos.filter((y) => y !== x) })} aria-label={`Remover ${x}`}><Icone nome="x" tamanho={12} /></button>
                  </span>
                ))}
              </div>
              <form className="linha-adicionar" onSubmit={addTipo} style={{ borderTop: '1px solid var(--separador)' }}>
                <label className="sr" htmlFor="cfg-tipo">Novo tipo</label>
                <input id="cfg-tipo" required value={tipo} onChange={(e) => setTipo(e.target.value)} placeholder="Novo tipo (ex.: Motion)" />
                <button type="submit" className="btn texto pequeno">Adicionar</button>
              </form>
            </div>
          </section>
        );
      case 'atalho':
        return (
          <section className="grupo-ios">
            <ul className="lista-ios">
              <li className="linha-ios">
                <span className="rotulo">Abrir o DONELY com um clique</span>
                <button type="button" className="btn texto pequeno" onClick={criarAtalho} disabled={criandoAtalho}>{criandoAtalho ? 'Criando…' : 'Criar atalho'}</button>
              </li>
            </ul>
            <p className={`grupo-nota ${resultadoAtalho?.erro ? 'erro-campo' : ''}`} role="status">
              {resultadoAtalho?.texto ?? 'Coloca o ícone do DONELY na área de trabalho do Windows. Ele abre o app e o navegador, e o app ganha o botão Desligar.'}
            </p>
          </section>
        );
      case 'dicas':
        return <DicasIA />;
    }
  }

  return (
    <Modal titulo="Configurações" cheio onFechar={onFechar}>
      <div className="config-layout">
        <nav className="config-nav" aria-label="Seções das configurações">
          {secoes.map(([k, n]) => (
            <button key={k} type="button" aria-current={secao === k ? 'true' : undefined} onClick={() => setSecao(k)}>{n}</button>
          ))}
        </nav>
        <div className={`config-painel ${secao === 'dicas' ? 'config-largo' : ''}`}>
          <header className="config-cab">
            <h3 className="config-titulo">{titulo}</h3>
            <p className="config-desc">{DESCRICOES[secao]}</p>
          </header>
          {conteudo()}
        </div>
      </div>
    </Modal>
  );
}
