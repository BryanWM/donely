import { useState, type FormEvent } from 'react';
import { OPCOES_ARQUIVAR, type Cliente, type Config, type Tema } from '../../shared/dominio';
import type { Acoes } from '../acoes';
import { api } from '../api';
import { Icone } from './Icone';
import { Modal } from './Modal';

interface Props { config: Config; clientes: Cliente[]; acoes: Acoes; onFechar: () => void; /** No WSL: mostra "Criar atalho na área de trabalho". */ atalho: boolean }

const TEMAS: [Tema, string][] = [['claro', 'Claro'], ['escuro', 'Escuro'], ['auto', 'Automático']];

export function Configuracoes({ config, clientes, acoes, onFechar, atalho }: Props) {
  const [criandoAtalho, setCriandoAtalho] = useState(false);
  const [resultadoAtalho, setResultadoAtalho] = useState<{ texto: string; erro?: boolean } | null>(null);

  async function criarAtalho() {
    setCriandoAtalho(true); setResultadoAtalho(null);
    try { const { caminho } = await api.criarAtalho(); setResultadoAtalho({ texto: `Pronto: o atalho DONELY está na área de trabalho (${caminho}).` }); }
    catch (e) { setResultadoAtalho({ texto: e instanceof Error ? e.message : 'Não foi possível criar o atalho.', erro: true }); }
    finally { setCriandoAtalho(false); }
  }
  const [cliente, setCliente] = useState('');
  const [tipo, setTipo] = useState('');

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

  return (
    <Modal titulo="Configurações" onFechar={onFechar}>
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
        <p className="grupo-nota">Arquivar concluídas: quanto tempo a tarefa fica em Concluído antes de ir para o Histórico.</p>
      </section>

      <section className="grupo-ios">
        <h3 className="grupo-titulo">Clientes <span className="contagem">{clientes.length}</span></h3>
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
        <p className="grupo-nota">Aparecem na Nova tarefa e no filtro da lista. Cliente é opcional em cada tarefa.</p>
      </section>

      <section className="grupo-ios">
        <h3 className="grupo-titulo">Tipos de tarefa</h3>
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

      {atalho && (
        <section className="grupo-ios">
          <h3 className="grupo-titulo">Atalho na área de trabalho</h3>
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
      )}
    </Modal>
  );
}
