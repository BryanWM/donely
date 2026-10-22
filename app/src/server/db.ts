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
     status TEXT NOT NULL DEFAULT 'a_fazer' CHECK (status IN ('a_fazer', 'fazendo', 'aguardando', 'concluido')),
     concluido_em TEXT,
     arquivada_em TEXT,
     criado_em TEXT NOT NULL,
     atualizado_em TEXT NOT NULL,
     origem TEXT NOT NULL DEFAULT 'local' CHECK (origem IN ('local', 'notion')),
     origem_id TEXT,
     origem_url TEXT,
     UNIQUE (origem, origem_id)
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
