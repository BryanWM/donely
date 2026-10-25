// Regras do quadro pessoal, usadas pelo servidor e pela interface.

export const COLUNAS = [
  { id: 'a_fazer', nome: 'A fazer' },
  { id: 'fazendo', nome: 'Fazendo' },
  { id: 'concluido', nome: 'Concluído' },
] as const;

export type Status = (typeof COLUNAS)[number]['id'];
export const STATUS = COLUNAS.map((c) => c.id) as [Status, ...Status[]];
export const NOME_STATUS: Record<Status, string> = Object.fromEntries(COLUNAS.map((c) => [c.id, c.nome])) as Record<Status, string>;

export const PRIORIDADES = ['urgente', 'alta', 'normal'] as const;
export type Prioridade = (typeof PRIORIDADES)[number];
export const NOME_PRIORIDADE: Record<Prioridade, string> = { urgente: 'Urgente', alta: 'Alta', normal: 'Normal' };
const ORDEM_PRIORIDADE: Record<Prioridade, number> = { urgente: 0, alta: 1, normal: 2 };

export const TIPOS_PADRAO = ['Post', 'Carrossel', 'Vídeo', 'Arte', 'Documento', 'Roteiro', 'Reunião', 'Outro'];
export const OPCOES_ARQUIVAR = [1, 3, 7, 14] as const;

export interface ItemChecklist { id: string; texto: string; feito: boolean }
export interface Evento { em: string; texto: string }
/** Arquivo do briefing. Os bytes ficam no servidor, em /api/anexos/:id. */
export type PapelAnexo = 'material' | 'referencia';
export interface Anexo { id: string; nome: string; tipo: string; tamanho: number; papel: PapelAnexo }
/** Material produzido aceita qualquer arquivo; só estes tipos abrem no navegador, o resto é baixado. */
export const TIPOS_PREVIA = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/pdf', 'video/mp4', 'video/webm', 'video/quicktime'];
// shortcut: o arquivo vai inteiro para a memória e para o SQLite; acima disso, gravar em disco e servir em stream.
export const LIMITE_ANEXO = 100 * 1024 * 1024;

export interface Tarefa {
  id: string;
  titulo: string;
  notas: string;
  cliente: string;
  tipo: string;
  prioridade: Prioridade;
  /** Data no formato AAAA-MM-DD, sem hora. */
  prazo: string | null;
  status: Status;
  concluidoEm: string | null;
  /** Preenchido quando a pessoa arquiva à mão. O arquivamento automático é calculado. */
  arquivadaEm: string | null;
  criadoEm: string;
  atualizadoEm: string;
  checklist: ItemChecklist[];
  eventos: Evento[];
  anexos: Anexo[];
}

export interface Cliente { id: string; nome: string }

// ---------- demandas não planejadas ----------

export const PRIORIDADES_DEMANDA = ['normal', 'urgente'] as const;
export type PrioridadeDemanda = (typeof PRIORIDADES_DEMANDA)[number];
export const ORIGENS_SUGERIDAS = ['Gestor', 'Colega', 'Cliente'];

export interface Demanda {
  id: string;
  descricao: string;
  origem: string;
  prioridade: PrioridadeDemanda;
  capturadaEm: string;
  /** Início do trecho em execução; nulo quando pendente, pausada ou concluída. */
  iniciadaEm: string | null;
  /** Tempo de execução já fechado, sem contar o trecho em andamento. */
  tempoMs: number;
  concluidaEm: string | null;
}

export type EstadoDemanda = 'pendente' | 'em_execucao' | 'concluida';
export const estadoDemanda = (d: Pick<Demanda, 'iniciadaEm' | 'concluidaEm'>): EstadoDemanda =>
  d.concluidaEm ? 'concluida' : d.iniciadaEm ? 'em_execucao' : 'pendente';

/** Tempo total de execução, contando o trecho em andamento até `agora`. Pausas não contam. */
export const tempoDemanda = (d: Pick<Demanda, 'iniciadaEm' | 'tempoMs'>, agora = Date.now()) =>
  d.tempoMs + (d.iniciadaEm ? Math.max(0, agora - Date.parse(d.iniciadaEm)) : 0);

/** "1 h 05 min", "12 min", "menos de 1 min"; com segundos vira relógio: "0:12:34". */
export function formatarDuracao(ms: number, comSegundos = false): string {
  const s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  if (comSegundos) return `${h}:${pad(m)}:${pad(s % 60)}`;
  if (s < 60) return s > 0 ? 'menos de 1 min' : '0 min';
  return h ? `${h} h ${pad(m)} min` : `${m} min`;
}

export type Tema = 'claro' | 'escuro' | 'auto';
export interface Config {
  arquivarAposDias: number; tipos: string[]; tema: Tema;
}
export const CONFIG_PADRAO: Config = { arquivarAposDias: 3, tipos: TIPOS_PADRAO, tema: 'claro' };


// ---------- datas (sempre no fuso da máquina) ----------

const pad = (n: number) => String(n).padStart(2, '0');
export const diaLocal = (d: Date = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const paraData = (dia: string) => { const [a, m, d] = dia.split('-').map(Number); return new Date(a, m - 1, d); };
/** Dias de calendário de `b` até `a` (positivo se `a` vem depois). */
export const diasEntre = (a: string, b: string) => Math.round((paraData(a).getTime() - paraData(b).getTime()) / 86_400_000);
export const somarDias = (dia: string, n: number) => { const d = paraData(dia); d.setDate(d.getDate() + n); return diaLocal(d); };
export const inicioDaSemana = (dia: string) => { const d = paraData(dia); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return diaLocal(d); };

// ---------- regras ----------

/** Uma tarefa concluída sai do quadro depois de N dias, ou na hora se for arquivada à mão. */
export function estaArquivada(t: Pick<Tarefa, 'status' | 'concluidoEm' | 'arquivadaEm'>, arquivarAposDias: number, hoje: string): boolean {
  if (t.status !== 'concluido' || !t.concluidoEm) return false;
  if (t.arquivadaEm) return true;
  return diasEntre(hoje, diaLocal(new Date(t.concluidoEm))) >= arquivarAposDias;
}

/** Quantos dias faltam para uma tarefa concluída ir para o Histórico (mínimo 1). */
export function diasParaArquivar(t: Pick<Tarefa, 'concluidoEm'>, arquivarAposDias: number, hoje: string): number {
  if (!t.concluidoEm) return arquivarAposDias;
  return Math.max(1, arquivarAposDias - diasEntre(hoje, diaLocal(new Date(t.concluidoEm))));
}

export type SituacaoPrazo = { tipo: 'atrasada'; dias: number } | { tipo: 'hoje' } | { tipo: 'futuro'; dias: number };

export function situacaoPrazo(t: Pick<Tarefa, 'status' | 'prazo'>, hoje: string): SituacaoPrazo | null {
  if (t.status === 'concluido' || !t.prazo) return null;
  const n = diasEntre(t.prazo, hoje);
  if (n < 0) return { tipo: 'atrasada', dias: -n };
  if (n === 0) return { tipo: 'hoje' };
  return { tipo: 'futuro', dias: n };
}

/** Ordem do quadro: atrasadas primeiro, depois prioridade, depois prazo (sem prazo por último). */
export function ordenarTarefas<T extends Pick<Tarefa, 'status' | 'prazo' | 'prioridade' | 'criadoEm'>>(lista: T[], hoje: string): T[] {
  const atrasada = (t: T) => (situacaoPrazo(t, hoje)?.tipo === 'atrasada' ? 0 : 1);
  return [...lista].sort((a, b) =>
    atrasada(a) - atrasada(b)
    || ORDEM_PRIORIDADE[a.prioridade] - ORDEM_PRIORIDADE[b.prioridade]
    || (a.prazo ?? '9999-99-99').localeCompare(b.prazo ?? '9999-99-99')
    || a.criadoEm.localeCompare(b.criadoEm));
}

// ---------- histórico e relatório ----------

export type TipoPeriodo = 'semana' | 'mes' | 'periodo';
export interface Periodo { inicio: string; fim: string }

/** Semana (segunda a domingo) ou mês que contém `dia`. As datas são inclusivas. */
export function periodoDe(tipo: Exclude<TipoPeriodo, 'periodo'>, dia: string): Periodo {
  if (tipo === 'semana') { const inicio = inicioDaSemana(dia); return { inicio, fim: somarDias(inicio, 6) }; }
  const [a, m] = dia.split('-').map(Number);
  return { inicio: `${a}-${pad(m)}-01`, fim: diaLocal(new Date(a, m, 0)) };
}

/** O mesmo tipo de período, deslocado para trás (-1) ou para frente (+1). */
export function deslocarPeriodo(tipo: Exclude<TipoPeriodo, 'periodo'>, p: Periodo, passo: number): Periodo {
  if (tipo === 'semana') return periodoDe('semana', somarDias(p.inicio, 7 * passo));
  const [a, m] = p.inicio.split('-').map(Number);
  return periodoDe('mes', diaLocal(new Date(a, m - 1 + passo, 1)));
}

/** Uma linha do histórico: tarefa planejada ou demanda não planejada, já concluída. */
export interface Registro {
  tipo: 'tarefa' | 'demanda';
  id: string;
  titulo: string;
  /** Cliente da tarefa ou quem pediu a demanda. */
  quem: string;
  categoria: string;
  concluidoEm: string;
  dia: string;
  /** Só as demandas têm tempo cronometrado. */
  tempoMs: number | null;
}

export function registrosDoPeriodo(tarefas: Tarefa[], demandas: Demanda[], p: Periodo): Registro[] {
  const dentro = (dia: string) => dia >= p.inicio && dia <= p.fim;
  const lista: Registro[] = [
    ...tarefas.filter((t) => t.status === 'concluido' && t.concluidoEm).map((t) => ({
      tipo: 'tarefa' as const, id: t.id, titulo: t.titulo, quem: t.cliente, categoria: t.tipo,
      concluidoEm: t.concluidoEm!, dia: diaLocal(new Date(t.concluidoEm!)), tempoMs: null,
    })),
    ...demandas.filter((d) => d.concluidaEm).map((d) => ({
      tipo: 'demanda' as const, id: d.id, titulo: d.descricao, quem: d.origem, categoria: '',
      concluidoEm: d.concluidaEm!, dia: diaLocal(new Date(d.concluidaEm!)), tempoMs: d.tempoMs,
    })),
  ];
  return lista.filter((r) => dentro(r.dia)).sort((a, b) => b.concluidoEm.localeCompare(a.concluidoEm));
}

const DIA_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
export const rotuloDia = (dia: string) => { const [a, m, d] = dia.split('-').map(Number); return `${DIA_SEMANA[new Date(a, m - 1, d).getDay()]}, ${pad(d)}/${pad(m)}`; };
export const dataCurta = (dia: string) => dia.split('-').reverse().join('/');

/** Texto pronto para colar em e-mail, chat ou documento. */
export function textoRelatorio(registros: Registro[], p: Periodo): string {
  const tarefas = registros.filter((r) => r.tipo === 'tarefa').length;
  const demandas = registros.filter((r) => r.tipo === 'demanda');
  const tempo = demandas.reduce((s, r) => s + (r.tempoMs ?? 0), 0);
  const linhas = [
    `Relatório de atividades: ${dataCurta(p.inicio)} a ${dataCurta(p.fim)}`,
    `${tarefas} ${tarefas === 1 ? 'tarefa concluída' : 'tarefas concluídas'} · ${demandas.length} ${demandas.length === 1 ? 'demanda não planejada' : 'demandas não planejadas'} (${formatarDuracao(tempo)})`,
  ];
  let diaAtual = '';
  for (const r of registros) {
    if (r.dia !== diaAtual) { diaAtual = r.dia; linhas.push('', rotuloDia(r.dia)); }
    const extra = r.tipo === 'tarefa'
      ? [r.quem, r.categoria].filter(Boolean).join(' · ')
      : [r.quem && `pedido por ${r.quem}`, r.tempoMs ? formatarDuracao(r.tempoMs) : ''].filter(Boolean).join(' · ');
    linhas.push(`- ${r.tipo === 'demanda' ? '[Não planejada] ' : ''}${r.titulo}${extra ? ` (${extra})` : ''}`);
  }
  if (!registros.length) linhas.push('', 'Nada concluído neste período.');
  return linhas.join('\n');
}
