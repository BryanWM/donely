import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import {
  CONFIG_PADRAO, NOME_PRIORIDADE, NOME_STATUS,
  type Anexo, type Cliente, type Config, type PapelAnexo, type Demanda, type Prioridade, type PrioridadeDemanda, type Status, type Tarefa,
} from '../shared/dominio';

type Linha = Record<string, string | number | null>;
const agora = () => new Date().toISOString();
// Sem a coluna dos bytes: a lista de tarefas não carrega os arquivos.
const CAMPOS_ANEXO = 'id, tarefa_id, nome, tipo, tamanho, papel';

export interface NovaTarefa {
  titulo: string;
  notas?: string;
  cliente?: string;
  tipo?: string;
  prioridade?: Prioridade;
  prazo?: string | null;
  status?: Status;
  checklist?: string[];
}
export interface NovaDemanda { descricao: string; origem?: string; prioridade?: PrioridadeDemanda }
export type CamposTarefa = Partial<Pick<Tarefa, 'titulo' | 'notas' | 'cliente' | 'tipo' | 'prioridade' | 'prazo'>>;

export class Repositorio {
  /** `relogio` existe para os testes do cronômetro controlarem o tempo. */
  constructor(private db: DatabaseSync, private relogio: () => Date = () => new Date()) {}

  // ---------- leitura ----------

  listarTarefas(): Tarefa[] {
    const linhas = this.db.prepare('SELECT * FROM tarefas ORDER BY criado_em').all() as Linha[];
    const checklist = this.db.prepare('SELECT * FROM checklist ORDER BY posicao').all() as Linha[];
    const links = this.db.prepare('SELECT * FROM links ORDER BY posicao').all() as Linha[];
    const eventos = this.db.prepare('SELECT * FROM eventos ORDER BY id').all() as Linha[];
    const anexos = this.db.prepare(`SELECT ${CAMPOS_ANEXO} FROM anexos ORDER BY criado_em`).all() as Linha[];
    return linhas.map((l) => this.montar(l, checklist, links, eventos, anexos));
  }

  obterTarefa(id: string): Tarefa | null {
    const l = this.db.prepare('SELECT * FROM tarefas WHERE id = ?').get(id) as Linha | undefined;
    if (!l) return null;
    const porTarefa = (tabela: string, ordem: string) => this.db.prepare(`SELECT * FROM ${tabela} WHERE tarefa_id = ? ORDER BY ${ordem}`).all(id) as Linha[];
    const anexos = this.db.prepare(`SELECT ${CAMPOS_ANEXO} FROM anexos WHERE tarefa_id = ? ORDER BY criado_em`).all(id) as Linha[];
    return this.montar(l, porTarefa('checklist', 'posicao'), porTarefa('links', 'posicao'), porTarefa('eventos', 'id'), anexos);
  }

  private montar(l: Linha, checklist: Linha[], links: Linha[], eventos: Linha[], anexos: Linha[]): Tarefa {
    const id = String(l.id);
    return {
      id,
      titulo: String(l.titulo), notas: String(l.notas), cliente: String(l.cliente), tipo: String(l.tipo),
      prioridade: l.prioridade as Prioridade, prazo: (l.prazo as string) ?? null, status: l.status as Status,
      concluidoEm: (l.concluido_em as string) ?? null, arquivadaEm: (l.arquivada_em as string) ?? null,
      criadoEm: String(l.criado_em), atualizadoEm: String(l.atualizado_em),
      checklist: checklist.filter((c) => c.tarefa_id === id).map((c) => ({ id: String(c.id), texto: String(c.texto), feito: Number(c.feito) === 1 })),
      links: links.filter((c) => c.tarefa_id === id).map((c) => ({ id: String(c.id), url: String(c.url), rotulo: String(c.rotulo) })),
      eventos: eventos.filter((c) => c.tarefa_id === id).map((c) => ({ em: String(c.em), texto: String(c.texto) })),
      anexos: anexos.filter((c) => c.tarefa_id === id).map((c): Anexo => ({ id: String(c.id), nome: String(c.nome), tipo: String(c.tipo), tamanho: Number(c.tamanho), papel: c.papel as PapelAnexo })),
    };
  }

  // ---------- escrita ----------

  private registrar(tarefaId: string, texto: string) {
    this.db.prepare('INSERT INTO eventos (tarefa_id, em, texto) VALUES (?, ?, ?)').run(tarefaId, agora(), texto);
  }

  private tocar(id: string) {
    this.db.prepare('UPDATE tarefas SET atualizado_em = ? WHERE id = ?').run(agora(), id);
  }

  private emAndamento = false;
  /** Reentrante: chamada dentro de outra transação, só executa (o BEGIN de fora já cobre tudo). */
  private emTransacao<T>(fn: () => T): T {
    if (this.emAndamento) return fn();
    this.emAndamento = true;
    this.db.exec('BEGIN');
    try { const r = fn(); this.db.exec('COMMIT'); return r; } catch (e) { this.db.exec('ROLLBACK'); throw e; } finally { this.emAndamento = false; }
  }

  criarTarefa(n: NovaTarefa): Tarefa {
    const id = randomUUID(), t = agora(), status = n.status ?? 'a_fazer';
    this.emTransacao(() => {
      this.db.prepare(`INSERT INTO tarefas (id, titulo, notas, cliente, tipo, prioridade, prazo, status, concluido_em, criado_em, atualizado_em)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        id, n.titulo, n.notas ?? '', n.cliente ?? '', n.tipo ?? '', n.prioridade ?? 'normal', n.prazo ?? null, status,
        status === 'concluido' ? t : null, t, t);
      (n.checklist ?? []).forEach((texto, i) => this.db.prepare('INSERT INTO checklist (id, tarefa_id, texto, posicao) VALUES (?, ?, ?, ?)').run(randomUUID(), id, texto, i));
      this.registrar(id, 'Criou a tarefa');
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
      this.registrar(id, 'Arquivou no Histórico');
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

  // ---------- anexos ----------

  adicionarAnexo(tarefaId: string, nome: string, tipo: string, dados: Uint8Array, papel: PapelAnexo = 'material'): Tarefa | null {
    if (!this.obterTarefa(tarefaId)) return null;
    this.db.prepare('INSERT INTO anexos (id, tarefa_id, nome, tipo, tamanho, dados, criado_em, papel) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(randomUUID(), tarefaId, nome, tipo, dados.length, dados, agora(), papel);
    this.tocar(tarefaId);
    this.registrar(tarefaId, `${papel === 'referencia' ? 'Adicionou referência' : 'Adicionou material'}: ${nome}`);
    return this.obterTarefa(tarefaId);
  }

  obterAnexo(id: string): { nome: string; tipo: string; dados: Uint8Array } | null {
    const a = this.db.prepare('SELECT nome, tipo, dados FROM anexos WHERE id = ?').get(id) as { nome: string; tipo: string; dados: Uint8Array } | undefined;
    return a ?? null;
  }

  removerAnexo(tarefaId: string, anexoId: string): Tarefa | null {
    const r = this.db.prepare('DELETE FROM anexos WHERE id = ? AND tarefa_id = ?').run(anexoId, tarefaId);
    if (!Number(r.changes)) return null;
    this.tocar(tarefaId);
    return this.obterTarefa(tarefaId);
  }

  // ---------- demandas não planejadas ----------

  listarDemandas(): Demanda[] {
    return (this.db.prepare('SELECT * FROM demandas ORDER BY capturada_em DESC').all() as Linha[]).map((d) => ({
      id: String(d.id), descricao: String(d.descricao), origem: String(d.origem), prioridade: d.prioridade as PrioridadeDemanda,
      capturadaEm: String(d.capturada_em), iniciadaEm: (d.iniciada_em as string) ?? null,
      tempoMs: Number(d.tempo_ms), concluidaEm: (d.concluida_em as string) ?? null,
    }));
  }

  /** Registra a demanda como pendente: capturar não inicia o cronômetro. */
  capturarDemanda(n: NovaDemanda): string {
    const id = randomUUID();
    this.db.prepare('INSERT INTO demandas (id, descricao, origem, prioridade, capturada_em) VALUES (?, ?, ?, ?, ?)')
      .run(id, n.descricao, n.origem ?? '', n.prioridade ?? 'normal', this.relogio().toISOString());
    return id;
  }

  /** Fecha o trecho em execução, somando-o ao tempo acumulado. */
  private fecharTrecho(id: string, fim: Date) {
    const d = this.db.prepare('SELECT iniciada_em FROM demandas WHERE id = ?').get(id) as { iniciada_em: string | null } | undefined;
    if (!d?.iniciada_em) return;
    const ms = Math.max(0, fim.getTime() - Date.parse(d.iniciada_em));
    this.db.prepare('UPDATE demandas SET tempo_ms = tempo_ms + ?, iniciada_em = NULL WHERE id = ?').run(ms, id);
  }

  private demandaAberta(id: string): boolean {
    return Boolean(this.db.prepare('SELECT 1 FROM demandas WHERE id = ? AND concluida_em IS NULL').get(id));
  }

  /** Inicia ou retoma. Só uma demanda corre por vez: a que estava em execução é pausada. */
  iniciarDemanda(id: string): boolean {
    if (!this.demandaAberta(id)) return false;
    const t = this.relogio();
    this.emTransacao(() => {
      const outras = this.db.prepare('SELECT id FROM demandas WHERE iniciada_em IS NOT NULL AND id <> ?').all(id) as { id: string }[];
      for (const o of outras) this.fecharTrecho(o.id, t);
      this.db.prepare('UPDATE demandas SET iniciada_em = COALESCE(iniciada_em, ?) WHERE id = ?').run(t.toISOString(), id);
    });
    return true;
  }

  pausarDemanda(id: string): boolean {
    if (!this.demandaAberta(id)) return false;
    this.fecharTrecho(id, this.relogio());
    return true;
  }

  /** Encerra o cronômetro, guarda o tempo total e a hora de conclusão. A demanda fica no histórico. */
  concluirDemanda(id: string): boolean {
    if (!this.demandaAberta(id)) return false;
    const t = this.relogio();
    this.emTransacao(() => {
      this.fecharTrecho(id, t);
      this.db.prepare('UPDATE demandas SET concluida_em = ? WHERE id = ?').run(t.toISOString(), id);
    });
    return true;
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

  atualizarCliente(id: string, baseUrl: string | null): Cliente | null {
    if (!Number(this.db.prepare('UPDATE clientes SET base_url = ? WHERE id = ?').run(baseUrl, id).changes)) return null;
    return this.listarClientes().find((c) => c.id === id) ?? null;
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
