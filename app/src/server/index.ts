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
const PORTA = Number(process.env.PORT ?? 3333);
const BANCO = process.env.DONELY_DB ?? join(RAIZ_APP, 'dados/donely.db');
const INTERFACE = join(RAIZ_APP, 'dist/client');

const repo = new Repositorio(abrirBanco(BANCO));
const app = new Hono();
app.route('/api', criarApi(repo));

// Em produção (npm start) o próprio servidor entrega a interface já compilada.
if (existsSync(INTERFACE)) {
  app.use('/*', serveStatic({ root: INTERFACE }));
  app.get('*', async (c) => c.html(await readFile(join(INTERFACE, 'index.html'), 'utf8')));
}

serve({ fetch: app.fetch, port: PORTA, hostname: '127.0.0.1' }, ({ port }) => {
  console.log(`DONELY rodando em http://localhost:${port}`);
  console.log(`Banco: ${BANCO}`);
});
