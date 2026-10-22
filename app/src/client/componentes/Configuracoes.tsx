import { useState, type FormEvent } from 'react';
import { OPCOES_ARQUIVAR, type Cliente, type Config, type Tema } from '../../shared/dominio';
import type { Acoes } from '../acoes';
import { Icone } from './Icone';
import { Modal } from './Modal';

interface Props { config: Config; clientes: Cliente[]; acoes: Acoes; onFechar: () => void }

const TEMAS: [Tema, string][] = [['claro', 'Claro'], ['escuro', 'Escuro'], ['auto', 'Automático']];

export function Configuracoes({ config, clientes, acoes, onFechar }: Props) {
  const [cliente, setCliente] = useState({ nome: '', base: '' });
  const [tipo, setTipo] = useState('');

  async function addCliente(e: FormEvent) {
    e.preventDefault();
    if (!cliente.nome.trim()) return;
    if (await acoes.criarCliente(cliente.nome.trim(), cliente.base.trim() || null)) setCliente({ nome: '', base: '' });
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
        <p className="grupo-nota">Tempo que uma tarefa fica em Concluído antes de ir para Tarefas feitas.</p>
      </section>

      <section className="grupo-ios">
        <h3 className="grupo-titulo">Clientes <span className="contagem">{clientes.length}</span></h3>
        <div className="lista-ios">
          <ul className="lista-ios">
            {clientes.map((c) => (
              <li key={c.id} className="linha-ios">
                <span className="rotulo">{c.nome}</span>
                <span className="controle">
                  {c.baseUrl && <a href={c.baseUrl} target="_blank" rel="noopener noreferrer"><Icone nome="livro" />Base</a>}
                  <button type="button" className="btn icone-so" onClick={() => acoes.removerCliente(c.id)} aria-label={`Remover ${c.nome}`}><Icone nome="x" tamanho={14} /></button>
                </span>
              </li>
            ))}
          </ul>
          <form className="linha-adicionar" onSubmit={addCliente}>
            <label className="sr" htmlFor="cfg-cliente">Nome do cliente</label>
            <input id="cfg-cliente" value={cliente.nome} onChange={(e) => setCliente({ ...cliente, nome: e.target.value })} placeholder="Novo cliente" />
            <label className="sr" htmlFor="cfg-base">Link da base</label>
            <input id="cfg-base" type="url" value={cliente.base} onChange={(e) => setCliente({ ...cliente, base: e.target.value })} placeholder="Link da base (opcional)" />
            <button type="submit" className="btn texto pequeno" disabled={!cliente.nome.trim()}>Adicionar</button>
          </form>
        </div>
        <p className="grupo-nota">O link da base (por exemplo, a página do cliente no Notion) aparece em cada tarefa dele.</p>
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
            <input id="cfg-tipo" value={tipo} onChange={(e) => setTipo(e.target.value)} placeholder="Novo tipo (ex.: Motion)" />
            <button type="submit" className="btn texto pequeno" disabled={!tipo.trim()}>Adicionar</button>
          </form>
        </div>
      </section>
    </Modal>
  );
}
