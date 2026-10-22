// Regras do quadro pessoal, usadas pelo servidor e pela interface.

export const COLUNAS = [
  { id: 'a_fazer', nome: 'A fazer' },
  { id: 'fazendo', nome: 'Fazendo' },
  { id: 'aguardando', nome: 'Aguardando retorno' },
  { id: 'concluido', nome: 'Concluído' },
] as const;

export type Status = (typeof COLUNAS)[number]['id'];
export const STATUS = COLUNAS.map((c) => c.id) as [Status, ...Status[]];
export const NOME_STATUS: Record<Status, string> = Object.fromEntries(COLUNAS.map((c) => [c.id, c.nome])) as Record<Status, string>;

export const PRIORIDADES = ['urgente', 'alta', 'normal'] as const;
export type Prioridade = (typeof PRIORIDADES)[number];
export const NOME_PRIORIDADE: Record<Prioridade, string> = { urgente: 'Urgente', alta: 'Alta', normal: 'Normal' };
const ORDEM_PRIORIDADE: Record<Prioridade, number> = { urgente: 0, alta: 1, normal: 2 };

/** De onde a tarefa veio. Tarefas de integração guardam o id e o link de origem. */
export const ORIGENS = ['local', 'notion'] as const;
export type Origem = (typeof ORIGENS)[number];

export const TIPOS_PADRAO = ['Post', 'Carrossel', 'Vídeo', 'Arte', 'Documento', 'Roteiro', 'Reunião', 'Outro'];
export const OPCOES_ARQUIVAR = [1, 3, 7, 14] as const;

export interface ItemChecklist { id: string; texto: string; feito: boolean }
export interface LinkTarefa { id: string; url: string; rotulo: string }
export interface Evento { em: string; texto: string }

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
  origem: Origem;
  origemId: string | null;
  origemUrl: string | null;
  checklist: ItemChecklist[];
  links: LinkTarefa[];
  eventos: Evento[];
}

export interface Cliente { id: string; nome: string; baseUrl: string | null }

export type Tema = 'claro' | 'escuro' | 'auto';
export interface Config { arquivarAposDias: number; tipos: string[]; tema: Tema }
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

/** Quantos dias faltam para uma tarefa concluída ir para Tarefas feitas (mínimo 1). */
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
