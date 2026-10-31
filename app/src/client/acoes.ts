import type { Cliente, Config, PapelAnexo, Status, Tarefa } from '../shared/dominio';
import type { CamposTarefa, NovaDemanda, NovaTarefa } from './api';

/** Tudo o que a interface pode pedir ao servidor. Cada ação já mostra o erro na tela se falhar. */
export interface Acoes {
  criar: (t: NovaTarefa) => Promise<Tarefa | undefined>;
  atualizar: (id: string, campos: CamposTarefa) => Promise<void>;
  mover: (id: string, status: Status) => Promise<void>;
  arquivar: (id: string) => Promise<void>;
  excluir: (id: string) => Promise<void>;
  adicionarItem: (id: string, texto: string) => Promise<void>;
  marcarItem: (id: string, item: string, feito: boolean) => Promise<void>;
  editarItem: (id: string, item: string, texto: string) => Promise<void>;
  removerItem: (id: string, item: string) => Promise<void>;
  criarCliente: (nome: string) => Promise<Cliente | undefined>;
  removerCliente: (id: string) => Promise<void>;
  anexar: (id: string, arquivos: File[], papel?: PapelAnexo) => Promise<void>;
  /** Link anexado no lugar de um arquivo. Devolve se deu certo (o campo só limpa quando deu). */
  anexarLink: (id: string, url: string, papel?: PapelAnexo) => Promise<boolean>;
  removerAnexo: (id: string, anexo: string) => Promise<void>;
  salvarConfig: (campos: Partial<Config>) => Promise<boolean>;
  capturar: (d: NovaDemanda) => Promise<boolean>;
  cronometro: (id: string, acao: 'iniciar' | 'pausar' | 'concluir') => Promise<void>;
  /** Finaliza a demanda com o registro do que foi feito, ou só grava/corrige o registro. Devolve se deu certo. */
  registroDemanda: (id: string, registro: string, finalizar: boolean) => Promise<boolean>;
}
