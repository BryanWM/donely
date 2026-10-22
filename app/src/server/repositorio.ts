import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import {
  CONFIG_PADRAO, NOME_PRIORIDADE, NOME_STATUS,
  type Cliente, type Config, type Origem, type Prioridade, type Status, type Tarefa,
} from '../shared/dominio';

type Linha = Record<string, string | number | null>;
const agora = () => new Date().toISOString();

export interface NovaTarefa {
  titulo: string;
  notas?: string;
  cliente?: string;
  tipo?: string;
  prioridade?: Prioridade;
  prazo?: string | null;
  status?: Status;
  checklist?: string[];
  origem?: Origem;
  origemId?: string | null;
  origemUrl?: string | null;
}
export type CamposTarefa = Partial<Pick<Tarefa, 'titulo' | 'notas' | 'cliente' | 'tipo' | 'prioridade' | 'prazo'>>;

export class Repositorio {
  constructor(private db: DatabaseSync) {}

  // ---------- leitura ----------

  listarTarefas(): Tarefa[] {
    const linhas = this.db.prepare('SELECT * FROM tarefas ORDER BY criado_em').all() as Linha[];
    const checklist = this.db.prepare('SELECT * FROM checklist ORDER BY posicao').all() as Linha[];
    const links = this.db.prepare('SELECT * FROM links ORDER BY posicao').all() as Linha[];
    const eventos = this.db.prepare('SELECT * FROM eventos ORDER BY id').all() as Linha[];
    return linhas.map((l) => this.montar(l, checklist, links, eventos));
  }

  obterTarefa(id: string): Tarefa | null {
    const l = this.db.prepare('SELECT * FROM tarefas WHERE id = ?').get(id) as Linha | undefined;
    if (!l) return null;
    const porTarefa = (tabela: string, ordem: string) => this.db.prepare(`SELECT * FROM ${tabela} WHERE tarefa_id = ? ORDER BY ${ordem}`).all(id) as Linha[];
    return this.montar(l, porTarefa('checklist', 'posicao'), porTarefa('links', 'posicao'), porTarefa('eventos', 'id'));
  }

  private montar(l: Linha, checklist: Linha[], links: Linha[], eventos: Linha[]): Tarefa {
    const id = String(l.id);
    return {
      id,
      titulo: String(l.titulo), notas: String(l.notas), cliente: String(l.cliente), tipo: String(l.tipo),
      prioridade: l.prioridade as Prioridade, prazo: (l.prazo as string) ?? null, status: l.status as Status,
      concluidoEm: (l.concluido_em as string) ?? null, arquivadaEm: (l.arquivada_em as string) ?? null,
      criadoEm: String(l.criado_em), atualizadoEm: String(l.atualizado_em),
      origem: l.origem as Origem, origemId: (l.origem_id as string) ?? null, origemUrl: (l.origem_url as string) ?? null,
      checklist: checklist.filter((c) => c.tarefa_id === id).map((c) => ({ id: String(c.id), texto: String(c.texto), feito: Number(c.feito) === 1 })),
      links: links.filter((c) => c.tarefa_id === id).map((c) => ({ id: String(c.id), url: String(c.url), rotulo: String(c.rotulo) })),
      eventos: eventos.filter((c) => c.tarefa_id === id).map((c) => ({ em: String(c.em), texto: String(c.texto) })),
    };
  }

  // ---------- escrita ----------

  private registrar(tarefaId: string, texto: string) {
    this.db.prepare('INSERT INTO eventos (tarefa_id, em, texto) VALUES (?, ?, ?)').run(tarefaId, agora(), texto);
  }

  private tocar(id: string) {
    this.db.prepare('UPDATE tarefas SET atualizado_em = ? WHERE id = ?').run(agora(), id);
  }

  private emTransacao<T>(fn: () => T): T {
    this.db.exec('BEGIN');
    try { const r = fn(); this.db.exec('COMMIT'); return r; } catch (e) { this.db.exec('ROLLBACK'); throw e; }
  }

  criarTarefa(n: NovaTarefa): Tarefa {
    const id = randomUUID(), t = agora(), status = n.status ?? 'a_fazer';
    this.emTransacao(() => {
      this.db.prepare(`INSERT INTO tarefas (id, titulo, notas, cliente, tipo, prioridade, prazo, status, concluido_em, criado_em, atualizado_em, origem, origem_id, origem_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        id, n.titulo, n.notas ?? '', n.cliente ?? '', n.tipo ?? '', n.prioridade ?? 'normal', n.prazo ?? null, status,
        status === 'concluido' ? t : null, t, t, n.origem ?? 'local', n.origemId ?? null, n.origemUrl ?? null);
      (n.checklist ?? []).forEach((texto, i) => this.db.prepare('INSERT INTO checklist (id, tarefa_id, texto, posicao) VALUES (?, ?, ?, ?)').run(randomUUID(), id, texto, i));
      this.registrar(id, n.origem && n.origem !== 'local' ? `Importou do ${n.origem === 'notion' ? 'Notion' : n.origem}` : 'Criou a tarefa');
    });
    return this.obterTarefa(id)!;
  }

  atualizarTarefa(id: string, campos: CamposTarefa): Tarefa | null {
    const atual = this.obterTarefa(id);
    if (!atual) return null;
    const colunas: Record<keyof CamposTarefa, string> = { titulo: 'titulo', notas: 'notas', cliente: 'cliente', tipo: 'tipo', prioridade: 'prioridade', prazo: 'prazo' };
    const mudancas = (Object.keys(campos) as (keyof CamposTarefa)[]).filter((k) => campos[k] !== undefined && campos[k] !== atual[k]);
    if (!mudancas.length) return atual;
    this.emTransacao(() => {
      for (const k of mudancas) this.db.prepare(`UPDATE tarefas SET ${colunas[k]} = ? WHERE id = ?`).run((campos[k] as string | null) ?? null, id);
      this.tocar(id);
      for (const k of mudancas) {
        if (k === 'titulo') this.registrar(id, 'Mudou o título');
        if (k === 'prioridade') this.registrar(id, `Prioridade: ${NOME_PRIORIDADE[campos.prioridade!]}`);
        if (k === 'prazo') this.registrar(id, campos.prazo ? `Prazo: ${campos.prazo.split('-').reverse().slice(0, 2).join('/')}` : 'Tirou o prazo');
        if (k === 'cliente') this.registrar(id, `Cliente: ${campos.cliente || 'nenhum'}`);
        if (k === 'tipo') this.registrar(id, `Tipo: ${campos.tipo || 'nenhum'}`);
      }
    });
    return this.obterTarefa(id);
  }

  moverTarefa(id: string, status: Status): Tarefa | null {
    const atual = this.obterTarefa(id);
    if (!atual) return null;
    if (atual.status === status) return atual;
    this.emTransacao(() => {
      this.db.prepare('UPDATE tarefas SET status = ?, concluido_em = ?, arquivada_em = NULL WHERE id = ?').run(status, status === 'concluido' ? agora() : null, id);
      this.tocar(id);
      this.registrar(id, `Moveu para ${NOME_STATUS[status]}`);
    });
    return this.obterTarefa(id);
  }

  arquivarAgora(id: string): Tarefa | null {
    const atual = this.obterTarefa(id);
    if (!atual || atual.status !== 'concluido') return atual;
    this.emTransacao(() => {
      this.db.prepare('UPDATE tarefas SET arquivada_em = ? WHERE id = ?').run(agora(), id);
      this.tocar(id);
      this.registrar(id, 'Arquivou em Tarefas feitas');
    });
    return this.obterTarefa(id);
  }

  excluirTarefa(id: string): boolean {
    return Number(this.db.prepare('DELETE FROM tarefas WHERE id = ?').run(id).changes) > 0;
  }

  // ---------- checklist e links ----------

  adicionarItem(tarefaId: string, texto: string): Tarefa | null {
    if (!this.obterTarefa(tarefaId)) return null;
    const pos = Number((this.db.prepare('SELECT COALESCE(MAX(posicao), -1) + 1 AS p FROM checklist WHERE tarefa_id = ?').get(tarefaId) as { p: number }).p);
    this.db.prepare('INSERT INTO checklist (id, tarefa_id, texto, posicao) VALUES (?, ?, ?, ?)').run(randomUUID(), tarefaId, texto, pos);
    this.tocar(tarefaId);
    return this.obterTarefa(tarefaId);
  }

  marcarItem(tarefaId: string, itemId: string, feito: boolean): Tarefa | null {
    const r = this.db.prepare('UPDATE checklist SET feito = ? WHERE id = ? AND tarefa_id = ?').run(feito ? 1 : 0, itemId, tarefaId);
    if (!Number(r.changes)) return null;
    this.tocar(tarefaId);
    return this.obterTarefa(tarefaId);
  }

  removerItem(tarefaId: string, itemId: string): Tarefa | null {
    const r = this.db.prepare('DELETE FROM checklist WHERE id = ? AND tarefa_id = ?').run(itemId, tarefaId);
    if (!Number(r.changes)) return null;
    this.tocar(tarefaId);
    return this.obterTarefa(tarefaId);
  }

  adicionarLink(tarefaId: string, url: string, rotulo: string): Tarefa | null {
    if (!this.obterTarefa(tarefaId)) return null;
    const pos = Number((this.db.prepare('SELECT COALESCE(MAX(posicao), -1) + 1 AS p FROM links WHERE tarefa_id = ?').get(tarefaId) as { p: number }).p);
    this.db.prepare('INSERT INTO links (id, tarefa_id, url, rotulo, posicao) VALUES (?, ?, ?, ?, ?)').run(randomUUID(), tarefaId, url, rotulo, pos);
    this.tocar(tarefaId);
    return this.obterTarefa(tarefaId);
  }

  removerLink(tarefaId: string, linkId: string): Tarefa | null {
    const r = this.db.prepare('DELETE FROM links WHERE id = ? AND tarefa_id = ?').run(linkId, tarefaId);
    if (!Number(r.changes)) return null;
    this.tocar(tarefaId);
    return this.obterTarefa(tarefaId);
  }

  // ---------- clientes e configuração ----------

  listarClientes(): Cliente[] {
    return (this.db.prepare('SELECT * FROM clientes ORDER BY nome COLLATE NOCASE').all() as Linha[])
      .map((c) => ({ id: String(c.id), nome: String(c.nome), baseUrl: (c.base_url as string) ?? null }));
  }

  /** Cria o cliente; devolve null se já existir um com o mesmo nome (sem diferenciar maiúsculas). */
  criarCliente(nome: string, baseUrl: string | null): Cliente | null {
    const existe = this.db.prepare('SELECT 1 FROM clientes WHERE nome = ? COLLATE NOCASE').get(nome);
    if (existe) return null;
    const id = randomUUID();
    this.db.prepare('INSERT INTO clientes (id, nome, base_url) VALUES (?, ?, ?)').run(id, nome, baseUrl);
    return { id, nome, baseUrl };
  }

  removerCliente(id: string): boolean {
    return Number(this.db.prepare('DELETE FROM clientes WHERE id = ?').run(id).changes) > 0;
  }

  obterConfig(): Config {
    const linhas = this.db.prepare('SELECT chave, valor FROM config').all() as { chave: string; valor: string }[];
    const salvo = Object.fromEntries(linhas.map((l) => [l.chave, JSON.parse(l.valor)]));
    return { ...CONFIG_PADRAO, ...salvo };
  }

  salvarConfig(campos: Partial<Config>): Config {
    const stmt = this.db.prepare('INSERT INTO config (chave, valor) VALUES (?, ?) ON CONFLICT (chave) DO UPDATE SET valor = excluded.valor');
    for (const [k, v] of Object.entries(campos)) if (v !== undefined) stmt.run(k, JSON.stringify(v));
    return this.obterConfig();
  }
}
