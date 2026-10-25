import { Hono, type Context } from 'hono';
import { z } from 'zod';
import { diaLocal, LIMITE_ANEXO, OPCOES_ARQUIVAR, PRIORIDADES, PRIORIDADES_DEMANDA, STATUS, TIPOS_PREVIA } from '../shared/dominio';
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
const novaDemanda = z.object({
  descricao: texto(500).min(1, 'Descreva o que foi pedido'),
  origem: texto(60).optional(),
  prioridade: z.enum(PRIORIDADES_DEMANDA).optional(),
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

/**
 * `sistema` traz o que depende de onde o app roda: `desligar` só quando aberto pelo atalho (scripts/iniciar.sh),
 * `criarAtalho` só no WSL (cria o ícone na área de trabalho do Windows e devolve onde ficou).
 */
export interface Sistema { desligar?: () => void; criarAtalho?: () => Promise<string> }
export function criarApi(repo: Repositorio, { desligar, criarAtalho }: Sistema = {}) {
  const api = new Hono();

  // O servidor não tem login: só aceita pedidos desta máquina e da própria interface.
  // Host protege contra DNS rebinding; Origin impede que outro site aberto no navegador chame a API.
  api.use('*', async (c, next) => {
    const host = (c.req.header('host') ?? '').replace(/:\d+$/, '');
    // Pedido que passou por túnel ou proxy externo chega com estes cabeçalhos: sem login, fica de fora.
    const repassado = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || c.req.header('forwarded');
    if (!LOCAL.has(host) || repassado) return c.json({ erro: 'Sem acesso por este endereço. Abra o DONELY nesta máquina, em http://localhost:5173.' }, 403);
    const origem = c.req.header('origin');
    if (origem) {
      let hostOrigem = '';
      try { hostOrigem = new URL(origem).hostname; } catch { /* origem inválida */ }
      if (!LOCAL.has(hostOrigem) && !LOCAL.has(`[${hostOrigem}]`)) return c.json({ erro: 'Origem não permitida' }, 403);
    }
    await next();
  });

  api.get('/estado', (c) => c.json({ tarefas: repo.listarTarefas(), demandas: repo.listarDemandas(), config: repo.obterConfig(), clientes: repo.listarClientes(), desligavel: Boolean(desligar), atalho: Boolean(criarAtalho) }));
  // Responde antes de desligar, para a interface saber que deu certo.
  api.post('/desligar', (c) => {
    if (!desligar) return c.json({ erro: 'Este servidor não foi aberto pelo atalho. Pare com Ctrl+C no terminal.' }, 404);
    setTimeout(desligar, 150);
    return c.body(null, 204);
  });
  api.post('/atalho', async (c) => {
    if (!criarAtalho) return c.json({ erro: 'O atalho só pode ser criado quando o DONELY roda no WSL, no Windows.' }, 404);
    try { return c.json({ caminho: await criarAtalho() }); }
    catch (e) { return c.json({ erro: e instanceof Error ? e.message : 'Não foi possível criar o atalho.' }, 500); }
  });

  // Demandas: toda resposta devolve a lista inteira, porque iniciar uma pausa a outra.
  api.post('/demandas', async (c) => {
    const d = await corpo(c, novaDemanda); if (d instanceof Response) return d;
    repo.capturarDemanda(d);
    return c.json(repo.listarDemandas(), 201);
  });
  for (const [acao, fn] of [['iniciar', repo.iniciarDemanda], ['pausar', repo.pausarDemanda], ['concluir', repo.concluirDemanda]] as const) {
    api.post(`/demandas/:id/${acao}`, (c) => (fn.call(repo, c.req.param('id'))
      ? c.json(repo.listarDemandas())
      : c.json({ erro: 'Demanda não encontrada ou já concluída' }, 404)));
  }

  api.post('/tarefas', async (c) => {
    const d = await corpo(c, novaTarefa); if (d instanceof Response) return d;
    if (d.prazo && d.prazo < diaLocal()) return c.json({ erro: 'Escolha um prazo de hoje em diante' }, 400);
    return c.json(repo.criarTarefa(d), 201);
  });

  // Material produzido: o corpo é o próprio arquivo, de qualquer tipo; o nome vai no cabeçalho x-nome.
  api.post('/tarefas/:id/anexos', async (c) => {
    const bruto = (c.req.header('content-type') ?? '').split(';')[0].trim().toLowerCase();
    const tipo = /^[a-z0-9.+-]+\/[a-z0-9.+-]+$/.test(bruto) ? bruto : 'application/octet-stream';
    if (Number(c.req.header('content-length') ?? 0) > LIMITE_ANEXO) return c.json({ erro: 'O arquivo passa de 100 MB' }, 413);
    const dados = new Uint8Array(await c.req.arrayBuffer());
    if (!dados.length) return c.json({ erro: 'O arquivo está vazio' }, 400);
    if (dados.length > LIMITE_ANEXO) return c.json({ erro: 'O arquivo passa de 100 MB' }, 413);
    let nome = 'anexo';
    try { nome = decodeURIComponent(c.req.header('x-nome') ?? '').trim().slice(0, 200) || nome; } catch { /* nome ilegível: fica "anexo" */ }
    const t = repo.adicionarAnexo(c.req.param('id'), nome, tipo, dados, c.req.query('papel') === 'referencia' ? 'referencia' : 'material');
    return t ? c.json(t, 201) : naoEncontrada(c);
  });
  api.get('/anexos/:id', (c) => {
    const a = repo.obterAnexo(c.req.param('id'));
    if (!a) return c.json({ erro: 'Anexo não encontrado' }, 404);
    // Só imagem, PDF e vídeo abrem no navegador; o resto (HTML, SVG, ZIP…) vai como download, nunca executa aqui.
    const previa = TIPOS_PREVIA.includes(a.tipo);
    return c.body(a.dados as Uint8Array<ArrayBuffer>, 200, {
      'content-type': previa ? a.tipo : 'application/octet-stream', 'x-content-type-options': 'nosniff',
      'content-security-policy': 'sandbox', 'cache-control': 'private, max-age=31536000, immutable',
      'content-disposition': `${previa ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(a.nome)}`,
    });
  });
  api.delete('/tarefas/:id/anexos/:anexo', (c) => {
    const t = repo.removerAnexo(c.req.param('id'), c.req.param('anexo'));
    return t ? c.json(t) : c.json({ erro: 'Anexo não encontrado' }, 404);
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
    const d = await corpo(c, z.object({ nome: texto(120).min(1, 'Dê um nome ao cliente') })); if (d instanceof Response) return d;
    const cli = repo.criarCliente(d.nome);
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
