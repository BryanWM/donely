import type { Cliente, Config, PapelAnexo, Demanda, Prioridade, PrioridadeDemanda, Status, Tarefa } from '../shared/dominio';

export interface Estado { tarefas: Tarefa[]; demandas: Demanda[]; config: Config; clientes: Cliente[]; /** Aberto pelo atalho: mostra o botão Desligar. */ desligavel: boolean; /** No WSL: as Configurações oferecem criar o atalho na área de trabalho. */ atalho: boolean }
export interface NovaDemanda { descricao: string; origem?: string; prioridade?: PrioridadeDemanda }
export interface NovaTarefa {
  titulo: string; notas?: string; cliente?: string; tipo?: string;
  prioridade?: Prioridade; prazo?: string | null; checklist?: string[];
}
export type CamposTarefa = Partial<Pick<Tarefa, 'titulo' | 'notas' | 'cliente' | 'tipo' | 'prioridade' | 'prazo'>>;

async function pedir<T>(metodo: string, caminho: string, corpo?: unknown): Promise<T> {
  let r: Response;
  try {
    r = await fetch(`/api${caminho}`, {
      method: metodo,
      headers: corpo === undefined ? undefined : { 'content-type': 'application/json' },
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    });
  } catch {
    throw new Error('O servidor do DONELY não respondeu. Confira se ele está rodando no terminal.');
  }
  if (!r.ok) {
    const e = (await r.json().catch(() => ({}))) as { erro?: string };
    throw new Error(e.erro ?? 'Não foi possível salvar. Tente de novo.');
  }
  return (r.status === 204 ? undefined : await r.json()) as T;
}

/** Envia o arquivo como corpo, de qualquer tipo (material produzido). */
async function enviarAnexo(id: string, arquivo: File, papel: PapelAnexo = 'material'): Promise<Tarefa> {
  let r: Response;
  try {
    r = await fetch(`/api/tarefas/${id}/anexos?papel=${papel}`, { method: 'POST', headers: { 'content-type': arquivo.type || 'application/octet-stream', 'x-nome': encodeURIComponent(arquivo.name) }, body: arquivo });
  } catch {
    throw new Error('O servidor do DONELY não respondeu. Confira se ele está rodando no terminal.');
  }
  if (!r.ok) throw new Error(((await r.json().catch(() => ({}))) as { erro?: string }).erro ?? `Não foi possível anexar ${arquivo.name}.`);
  return r.json() as Promise<Tarefa>;
}

export const api = {
  estado: () => pedir<Estado>('GET', '/estado'),
  criar: (t: NovaTarefa) => pedir<Tarefa>('POST', '/tarefas', t),
  atualizar: (id: string, campos: CamposTarefa) => pedir<Tarefa>('PATCH', `/tarefas/${id}`, campos),
  mover: (id: string, status: Status) => pedir<Tarefa>('POST', `/tarefas/${id}/mover`, { status }),
  arquivar: (id: string) => pedir<Tarefa>('POST', `/tarefas/${id}/arquivar`),
  excluir: (id: string) => pedir<void>('DELETE', `/tarefas/${id}`),
  adicionarItem: (id: string, texto: string) => pedir<Tarefa>('POST', `/tarefas/${id}/checklist`, { texto }),
  marcarItem: (id: string, item: string, feito: boolean) => pedir<Tarefa>('PATCH', `/tarefas/${id}/checklist/${item}`, { feito }),
  removerItem: (id: string, item: string) => pedir<Tarefa>('DELETE', `/tarefas/${id}/checklist/${item}`),
  criarCliente: (nome: string) => pedir<Cliente>('POST', '/clientes', { nome }),
  removerCliente: (id: string) => pedir<void>('DELETE', `/clientes/${id}`),
  anexar: enviarAnexo,
  desligar: () => pedir<void>('POST', '/desligar'),
  criarAtalho: () => pedir<{ caminho: string }>('POST', '/atalho'),
  removerAnexo: (id: string, anexo: string) => pedir<Tarefa>('DELETE', `/tarefas/${id}/anexos/${anexo}`),
  salvarConfig: (campos: Partial<Config>) => pedir<Config>('PATCH', '/config', campos),
  capturar: (d: NovaDemanda) => pedir<Demanda[]>('POST', '/demandas', d),
  cronometro: (id: string, acao: 'iniciar' | 'pausar' | 'concluir') => pedir<Demanda[]>('POST', `/demandas/${id}/${acao}`),
};
