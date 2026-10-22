import type { Cliente, Config, Status, Tarefa } from '../shared/dominio';
import type { CamposTarefa, NovaTarefa } from './api';

/** Tudo o que a interface pode pedir ao servidor. Cada ação já mostra o erro na tela se falhar. */
export interface Acoes {
  criar: (t: NovaTarefa) => Promise<Tarefa | undefined>;
  atualizar: (id: string, campos: CamposTarefa) => Promise<void>;
  mover: (id: string, status: Status) => Promise<void>;
  arquivar: (id: string) => Promise<void>;
  excluir: (id: string) => Promise<void>;
  adicionarItem: (id: string, texto: string) => Promise<void>;
  marcarItem: (id: string, item: string, feito: boolean) => Promise<void>;
  removerItem: (id: string, item: string) => Promise<void>;
  adicionarLink: (id: string, url: string, rotulo: string) => Promise<boolean>;
  removerLink: (id: string, link: string) => Promise<void>;
  criarCliente: (nome: string, baseUrl: string | null) => Promise<Cliente | undefined>;
  removerCliente: (id: string) => Promise<void>;
  salvarConfig: (campos: Partial<Config>) => Promise<void>;
}
