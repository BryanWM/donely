import type { Anotacao, InfoVersao, Pessoa, Rascunho } from '../shared/dominio';
import type { Cliente, Config, Demanda, Modelo, PapelAnexo, Prioridade, PrioridadeDemanda, Status, Tarefa } from '../shared/dominio';

export interface Estado { tarefas: Tarefa[]; demandas: Demanda[]; config: Config; clientes: Cliente[]; /** Aberto pelo atalho: mostra o botão Desligar. */ desligavel: boolean; /** No WSL: as Configurações oferecem criar o atalho na área de trabalho. */ atalho: boolean }
export interface NovaDemanda { descricao: string; origem?: string; prioridade?: PrioridadeDemanda }
export interface NovaTarefa {
  modelo?: Modelo;
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
  editarItem: (id: string, item: string, texto: string) => pedir<Tarefa>('PATCH', `/tarefas/${id}/checklist/${item}`, { texto }),
  removerItem: (id: string, item: string) => pedir<Tarefa>('DELETE', `/tarefas/${id}/checklist/${item}`),
  criarCliente: (nome: string) => pedir<Cliente>('POST', '/clientes', { nome }),
  removerCliente: (id: string) => pedir<void>('DELETE', `/clientes/${id}`),
  anexar: enviarAnexo,
  notas: () => pedir<{ pessoas: Pessoa[]; anotacoes: Anotacao[] }>('GET', '/notas'),
  rascunhos: () => pedir<Rascunho[]>('GET', '/rascunhos'),
  criarRascunho: () => pedir<Rascunho>('POST', '/rascunhos', {}),
  salvarRascunho: (id: string, campos: { titulo?: string; conteudo?: string; vinculo?: Rascunho['vinculo']; tags?: string[] }) => pedir<Rascunho>('PATCH', `/rascunhos/${id}`, campos),
  excluirRascunho: (id: string) => pedir<void>('DELETE', `/rascunhos/${id}`),
  criarPessoa: (nome: string) => pedir<Pessoa>('POST', '/pessoas', { nome }),
  criarAnotacao: (pessoaId: string, d: { titulo: string; conteudo: string }) => pedir<Anotacao>('POST', `/pessoas/${pessoaId}/anotacoes`, d),
  editarAnotacao: (id: string, d: { titulo: string; conteudo: string }) => pedir<Anotacao>('PATCH', `/anotacoes/${id}`, d),
  excluirAnotacao: (id: string) => pedir<void>('DELETE', `/anotacoes/${id}`),
  desligar: () => pedir<void>('POST', '/desligar'),
  versao: () => pedir<InfoVersao>('GET', '/versao'),
  criarAtalho: () => pedir<{ caminho: string }>('POST', '/atalho'),
  removerAnexo: (id: string, anexo: string) => pedir<Tarefa>('DELETE', `/tarefas/${id}/anexos/${anexo}`),
  salvarConfig: (campos: Partial<Config>) => pedir<Config>('PATCH', '/config', campos),
  capturar: (d: NovaDemanda) => pedir<Demanda[]>('POST', '/demandas', d),
  cronometro: (id: string, acao: 'iniciar' | 'pausar' | 'concluir') => pedir<Demanda[]>('POST', `/demandas/${id}/${acao}`),
  /** Finaliza com o registro do que foi feito (ou só grava/corrige o registro, com `finalizar` false). */
  registroDemanda: (id: string, registro: string, finalizar: boolean) =>
    finalizar ? pedir<Demanda[]>('POST', `/demandas/${id}/concluir`, { registro }) : pedir<Demanda[]>('PATCH', `/demandas/${id}`, { registro }),
  anexarLink: (id: string, url: string, papel: PapelAnexo = 'material') => pedir<Tarefa>('POST', `/tarefas/${id}/anexos/link`, { url, papel }),
};
