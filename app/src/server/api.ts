import { Hono, type Context } from 'hono';
import { z } from 'zod';
import { OPCOES_ARQUIVAR, PRIORIDADES, STATUS } from '../shared/dominio';
import type { Repositorio } from './repositorio';

const dia = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a data no formato AAAA-MM-DD');
const url = z.string().trim().url('Endereço inválido').refine((u) => /^https?:\/\//i.test(u), 'Use um endereço que comece com http:// ou https://');
const texto = (max: number) => z.string().trim().max(max);

const novaTarefa = z.object({
  titulo: texto(300).min(1, 'Dê um título para a tarefa'),
  notas: texto(20_000).optional(),
  cliente: texto(120).optional(),
  tipo: texto(60).optional(),
  prioridade: z.enum(PRIORIDADES).optional(),
  prazo: dia.nullable().optional(),
  status: z.enum(STATUS).optional(),
  checklist: z.array(texto(500).min(1)).max(100).optional(),
});
const camposTarefa = novaTarefa.pick({ notas: true, cliente: true, tipo: true, prioridade: true, prazo: true })
  .extend({ titulo: texto(300).min(1, 'O título não pode ficar vazio').optional() });

/** Lê e valida o corpo JSON. Devolve os dados ou uma resposta 400 com a mensagem do primeiro erro. */
async function corpo<T extends z.ZodType>(c: Context, schema: T): Promise<z.infer<T> | Response> {
  const bruto = await c.req.json().catch(() => undefined);
  const r = schema.safeParse(bruto);
  if (!r.success) return c.json({ erro: r.error.issues[0]?.message ?? 'Dados inválidos' }, 400);
  return r.data;
}
const naoEncontrada = (c: Context) => c.json({ erro: 'Tarefa não encontrada' }, 404);
const LOCAL = new Set(['127.0.0.1', 'localhost', '[::1]']);

export function criarApi(repo: Repositorio) {
  const api = new Hono();

  // O servidor não tem login: só aceita pedidos desta máquina e da própria interface.
  // Host protege contra DNS rebinding; Origin impede que outro site aberto no navegador chame a API.
  api.use('*', async (c, next) => {
    const host = (c.req.header('host') ?? '').replace(/:\d+$/, '');
    if (!LOCAL.has(host)) return c.json({ erro: 'Acesso permitido só a partir desta máquina' }, 403);
    const origem = c.req.header('origin');
    if (origem) {
      let hostOrigem = '';
      try { hostOrigem = new URL(origem).hostname; } catch { /* origem inválida */ }
      if (!LOCAL.has(hostOrigem) && !LOCAL.has(`[${hostOrigem}]`)) return c.json({ erro: 'Origem não permitida' }, 403);
    }
    await next();
  });

  api.get('/estado', (c) => c.json({ tarefas: repo.listarTarefas(), config: repo.obterConfig(), clientes: repo.listarClientes() }));

  api.post('/tarefas', async (c) => {
    const d = await corpo(c, novaTarefa); if (d instanceof Response) return d;
    return c.json(repo.criarTarefa(d), 201);
  });
  api.patch('/tarefas/:id', async (c) => {
    const d = await corpo(c, camposTarefa); if (d instanceof Response) return d;
    const t = repo.atualizarTarefa(c.req.param('id'), d);
    return t ? c.json(t) : naoEncontrada(c);
  });
  api.post('/tarefas/:id/mover', async (c) => {
    const d = await corpo(c, z.object({ status: z.enum(STATUS) })); if (d instanceof Response) return d;
    const t = repo.moverTarefa(c.req.param('id'), d.status);
    return t ? c.json(t) : naoEncontrada(c);
  });
  api.post('/tarefas/:id/arquivar', (c) => {
    const t = repo.arquivarAgora(c.req.param('id'));
    return t ? c.json(t) : naoEncontrada(c);
  });
  api.delete('/tarefas/:id', (c) => (repo.excluirTarefa(c.req.param('id')) ? c.body(null, 204) : naoEncontrada(c)));

  api.post('/tarefas/:id/checklist', async (c) => {
    const d = await corpo(c, z.object({ texto: texto(500).min(1, 'Escreva o item') })); if (d instanceof Response) return d;
    const t = repo.adicionarItem(c.req.param('id'), d.texto);
    return t ? c.json(t, 201) : naoEncontrada(c);
  });
  api.patch('/tarefas/:id/checklist/:item', async (c) => {
    const d = await corpo(c, z.object({ feito: z.boolean() })); if (d instanceof Response) return d;
    const t = repo.marcarItem(c.req.param('id'), c.req.param('item'), d.feito);
    return t ? c.json(t) : naoEncontrada(c);
  });
  api.delete('/tarefas/:id/checklist/:item', (c) => {
    const t = repo.removerItem(c.req.param('id'), c.req.param('item'));
    return t ? c.json(t) : naoEncontrada(c);
  });

  api.post('/tarefas/:id/links', async (c) => {
    const d = await corpo(c, z.object({ url, rotulo: texto(120).optional() })); if (d instanceof Response) return d;
    const t = repo.adicionarLink(c.req.param('id'), d.url, d.rotulo ?? '');
    return t ? c.json(t, 201) : naoEncontrada(c);
  });
  api.delete('/tarefas/:id/links/:link', (c) => {
    const t = repo.removerLink(c.req.param('id'), c.req.param('link'));
    return t ? c.json(t) : naoEncontrada(c);
  });

  api.post('/clientes', async (c) => {
    const d = await corpo(c, z.object({ nome: texto(120).min(1, 'Dê um nome ao cliente'), baseUrl: url.nullable().optional() })); if (d instanceof Response) return d;
    const cli = repo.criarCliente(d.nome, d.baseUrl ?? null);
    return cli ? c.json(cli, 201) : c.json({ erro: 'Já existe um cliente com esse nome' }, 409);
  });
  api.delete('/clientes/:id', (c) => (repo.removerCliente(c.req.param('id')) ? c.body(null, 204) : c.json({ erro: 'Cliente não encontrado' }, 404)));

  api.patch('/config', async (c) => {
    const d = await corpo(c, z.object({
      arquivarAposDias: z.number().int().refine((n) => (OPCOES_ARQUIVAR as readonly number[]).includes(n), 'Escolha 1, 3, 7 ou 14 dias').optional(),
      tipos: z.array(texto(60).min(1)).max(50).optional(),
      tema: z.enum(['claro', 'escuro', 'auto']).optional(),
    }));
    if (d instanceof Response) return d;
    return c.json(repo.salvarConfig(d));
  });

  return api;
}
