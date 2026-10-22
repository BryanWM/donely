import type { Cliente, Config, Prioridade, Status, Tarefa } from '../shared/dominio';

export interface Estado { tarefas: Tarefa[]; config: Config; clientes: Cliente[] }
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
  adicionarLink: (id: string, url: string, rotulo: string) => pedir<Tarefa>('POST', `/tarefas/${id}/links`, { url, rotulo }),
  removerLink: (id: string, link: string) => pedir<Tarefa>('DELETE', `/tarefas/${id}/links/${link}`),
  criarCliente: (nome: string, baseUrl: string | null) => pedir<Cliente>('POST', '/clientes', { nome, baseUrl }),
  removerCliente: (id: string) => pedir<void>('DELETE', `/clientes/${id}`),
  salvarConfig: (campos: Partial<Config>) => pedir<Config>('PATCH', '/config', campos),
};
