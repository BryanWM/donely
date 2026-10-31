import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

// Cada item roda uma vez, em ordem. Para mudar o banco, adicione um item novo; nunca edite um antigo.
const MIGRACOES: string[] = [
  `CREATE TABLE tarefas (
     id TEXT PRIMARY KEY,
     titulo TEXT NOT NULL,
     notas TEXT NOT NULL DEFAULT '',
     cliente TEXT NOT NULL DEFAULT '',
     tipo TEXT NOT NULL DEFAULT '',
     prioridade TEXT NOT NULL DEFAULT 'normal' CHECK (prioridade IN ('urgente', 'alta', 'normal')),
     prazo TEXT,
     status TEXT NOT NULL DEFAULT 'a_fazer' CHECK (status IN ('a_fazer', 'fazendo', 'concluido')),
     concluido_em TEXT,
     arquivada_em TEXT,
     criado_em TEXT NOT NULL,
     atualizado_em TEXT NOT NULL
   );
   CREATE INDEX idx_tarefas_status ON tarefas (status);
   CREATE TABLE checklist (
     id TEXT PRIMARY KEY,
     tarefa_id TEXT NOT NULL REFERENCES tarefas (id) ON DELETE CASCADE,
     texto TEXT NOT NULL,
     feito INTEGER NOT NULL DEFAULT 0,
     posicao INTEGER NOT NULL
   );
   CREATE TABLE links (
     id TEXT PRIMARY KEY,
     tarefa_id TEXT NOT NULL REFERENCES tarefas (id) ON DELETE CASCADE,
     url TEXT NOT NULL,
     rotulo TEXT NOT NULL DEFAULT '',
     posicao INTEGER NOT NULL
   );
   CREATE TABLE eventos (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     tarefa_id TEXT NOT NULL REFERENCES tarefas (id) ON DELETE CASCADE,
     em TEXT NOT NULL,
     texto TEXT NOT NULL
   );
   CREATE TABLE clientes (
     id TEXT PRIMARY KEY,
     nome TEXT NOT NULL UNIQUE COLLATE NOCASE,
     base_url TEXT
   );
   CREATE TABLE config (
     chave TEXT PRIMARY KEY,
     valor TEXT NOT NULL
   );`,
  // Demandas não planejadas: captura rápida com cronômetro. Ficam fora das colunas do quadro.
  // O tempo é tempo_ms acumulado mais o trecho aberto desde iniciada_em (nulo quando pausada).
  `CREATE TABLE demandas (
     id TEXT PRIMARY KEY,
     descricao TEXT NOT NULL,
     origem TEXT NOT NULL DEFAULT '',
     prioridade TEXT NOT NULL DEFAULT 'normal' CHECK (prioridade IN ('normal', 'urgente')),
     capturada_em TEXT NOT NULL,
     iniciada_em TEXT,
     tempo_ms INTEGER NOT NULL DEFAULT 0,
     concluida_em TEXT
   );
   CREATE INDEX idx_demandas_capturada ON demandas (capturada_em);`,
  // Arquivos do card, guardados no próprio banco: um arquivo só para copiar no backup.
  // O papel separa o material produzido das referências que orientam o trabalho.
  `CREATE TABLE anexos (
     id TEXT PRIMARY KEY,
     tarefa_id TEXT NOT NULL REFERENCES tarefas (id) ON DELETE CASCADE,
     nome TEXT NOT NULL,
     tipo TEXT NOT NULL,
     tamanho INTEGER NOT NULL,
     dados BLOB NOT NULL,
     criado_em TEXT NOT NULL,
     papel TEXT NOT NULL DEFAULT 'material' CHECK (papel IN ('material', 'referencia'))
   );
   CREATE INDEX idx_anexos_tarefa ON anexos (tarefa_id);`,
  // O cliente fica só com o nome: o link da base de cada um saiu.
  `ALTER TABLE clientes DROP COLUMN base_url;`,
  // A tabela de links da tarefa (versão anterior) saiu: o link agora é um anexo, com a coluna url.
  `DROP TABLE links;`,
  // Link no lugar de um arquivo: guarda o endereço, sem bytes.
  `ALTER TABLE anexos ADD COLUMN url TEXT;`,
  // Registro da demanda não planejada: o que foi feito, escrito ao finalizar (ou depois).
  `ALTER TABLE demandas ADD COLUMN registro TEXT NOT NULL DEFAULT '';`,
  // Bloco de notas por pessoa: as pessoas com quem se conversa e as anotações de cada uma (independentes das tarefas).
  `CREATE TABLE pessoas (
     id TEXT PRIMARY KEY,
     nome TEXT NOT NULL UNIQUE COLLATE NOCASE,
     criado_em TEXT NOT NULL
   );
   CREATE TABLE anotacoes (
     id TEXT PRIMARY KEY,
     pessoa_id TEXT NOT NULL REFERENCES pessoas (id) ON DELETE CASCADE,
     titulo TEXT NOT NULL DEFAULT '',
     conteudo TEXT NOT NULL,
     criado_em TEXT NOT NULL,
     atualizado_em TEXT NOT NULL
   );
   CREATE INDEX idx_anotacoes_pessoa ON anotacoes (pessoa_id, criado_em);`,
  // Rascunhos de ideias (aba Rascunhos): texto livre, com vínculo opcional a um cliente ou a uma tarefa.
  `CREATE TABLE rascunhos (
     id TEXT PRIMARY KEY,
     titulo TEXT NOT NULL DEFAULT '',
     conteudo TEXT NOT NULL DEFAULT '',
     vinculo_tipo TEXT CHECK (vinculo_tipo IN ('cliente', 'tarefa')),
     vinculo_id TEXT,
     criado_em TEXT NOT NULL,
     atualizado_em TEXT NOT NULL
   );`,
  // Modelo do card: Projeto (completo) ou Rápido (mínimo). Os registros anteriores ficam como Projeto.
  `ALTER TABLE tarefas ADD COLUMN modelo TEXT NOT NULL DEFAULT 'projeto' CHECK (modelo IN ('projeto', 'rapido'));`,
];

/** Abre (ou cria) o banco e aplica as migrações pendentes. Use ':memory:' nos testes. */
export function abrirBanco(caminho: string): DatabaseSync {
  if (caminho !== ':memory:') mkdirSync(dirname(caminho), { recursive: true });
  const db = new DatabaseSync(caminho);
  db.exec('PRAGMA foreign_keys = ON;');
  if (caminho !== ':memory:') db.exec('PRAGMA journal_mode = WAL;');
  const versao = Number((db.prepare('PRAGMA user_version').get() as { user_version: number }).user_version);
  for (let i = versao; i < MIGRACOES.length; i++) {
    db.exec('BEGIN');
    try {
      db.exec(MIGRACOES[i]);
      db.exec(`PRAGMA user_version = ${i + 1}`);
      db.exec('COMMIT');
    } catch (erro) {
      db.exec('ROLLBACK');
      throw erro;
    }
  }
  return db;
}
