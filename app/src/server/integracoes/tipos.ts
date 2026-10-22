// Contrato que toda integração (Notion e as próximas) segue.
// Ainda não há conector implementado: este arquivo fixa a forma para o primeiro, o do Notion.

import type { Prioridade, Status } from '../../shared/dominio';

/** Um card como ele vem da ferramenta externa, já traduzido para os campos do DONELY. */
export interface CardExterno {
  /** Id estável na origem. Junto com a origem, é único no banco: sincronizar de novo atualiza, não duplica. */
  origemId: string;
  origemUrl: string;
  titulo: string;
  cliente?: string;
  tipo?: string;
  prioridade?: Prioridade;
  prazo?: string | null;
  status?: Status;
  notas?: string;
}

export interface ResultadoSincronizacao {
  criadas: number;
  atualizadas: number;
  /** Mensagens para mostrar na tela quando algo falha. Nunca inclua tokens. */
  avisos: string[];
}

export interface Conector {
  /** Mesmo valor gravado em `tarefas.origem`. */
  id: 'notion';
  nome: string;
  /** Diz se o conector tem o que precisa no .env para funcionar. */
  configurado(): boolean;
  /** Busca os cards atribuídos à pessoa. Roda só no servidor. */
  buscarCards(): Promise<CardExterno[]>;
}
