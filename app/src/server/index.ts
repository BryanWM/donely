import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { criarApi } from './api';
import { abrirBanco } from './db';
import { Repositorio } from './repositorio';

const RAIZ_APP = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
// app/.env é opcional (porta e caminho do banco: veja .env.example).
if (existsSync(join(RAIZ_APP, '.env'))) process.loadEnvFile(join(RAIZ_APP, '.env'));
const PORTA = Number(process.env.PORT ?? 3333);
const BANCO = process.env.DONELY_DB ?? join(RAIZ_APP, 'dados/donely.db');
const INTERFACE = join(RAIZ_APP, 'dist/client');

const repo = new Repositorio(abrirBanco(BANCO));
const app = new Hono();
// Aberto pelo atalho, o servidor sabe o grupo de processos do app inteiro (servidor e interface) e pode encerrá-lo.
const grupo = Number(process.env.DONELY_PGID);
const desligar = grupo > 0 ? () => { try { process.kill(-grupo, 'SIGTERM'); } catch { process.exit(0); } } : undefined;
// No WSL, o botão "Criar atalho" das Configurações roda o mesmo script de scripts/criar-atalho.sh.
const criarAtalho = process.env.WSL_DISTRO_NAME ? () => new Promise<string>((ok, falha) => {
  execFile('bash', [join(RAIZ_APP, '../scripts/criar-atalho.sh')], { timeout: 60_000 }, (erro, saida, avisos) => {
    const ultima = (texto: string) => texto.trim().split('\n').pop() ?? '';
    if (erro) falha(new Error(ultima(avisos) || 'Não foi possível criar o atalho.'));
    else ok(ultima(saida).replace(/^Atalho criado: /, ''));
  });
}) : undefined;
app.route('/api', criarApi(repo, { desligar, criarAtalho }));

// Em produção (npm start) o próprio servidor entrega a interface já compilada.
if (existsSync(INTERFACE)) {
  app.use('/*', serveStatic({ root: INTERFACE }));
  app.get('*', async (c) => c.html(await readFile(join(INTERFACE, 'index.html'), 'utf8')));
}

serve({ fetch: app.fetch, port: PORTA, hostname: '127.0.0.1' }, ({ port }) => {
  console.log(`DONELY rodando em http://localhost:${port}`);
  console.log(`Banco: ${BANCO}`);
});
