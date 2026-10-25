import { beforeEach, describe, expect, it } from 'vitest';
import type { Hono } from 'hono';
import { criarApi } from './api';
import { abrirBanco } from './db';
import { Repositorio } from './repositorio';

let api: Hono;
const LOCAL = { host: 'localhost:3333', 'content-type': 'application/json' };
const pedir = (metodo: string, caminho: string, corpo?: unknown, cabecalhos: Record<string, string> = LOCAL) =>
  api.request(caminho, { method: metodo, headers: cabecalhos, body: corpo === undefined ? undefined : JSON.stringify(corpo) });

beforeEach(() => { api = criarApi(new Repositorio(abrirBanco(':memory:'))); });

describe('tarefas', () => {
  it('cria, lista e move uma tarefa até concluir', async () => {
    const criada = await (await pedir('POST', '/tarefas', { titulo: 'Arte do cardápio', cliente: 'Trigo Fino', checklist: ['Capa', 'Preços'] })).json();
    expect(criada.status).toBe('a_fazer');
    expect(criada.checklist).toHaveLength(2);

    const movida = await (await pedir('POST', `/tarefas/${criada.id}/mover`, { status: 'concluido' })).json();
    expect(movida.status).toBe('concluido');
    expect(movida.concluidoEm).toBeTruthy();
    expect(movida.eventos.map((e: { texto: string }) => e.texto)).toEqual(['Criou a tarefa', 'Moveu para Concluído']);

    const voltou = await (await pedir('POST', `/tarefas/${criada.id}/mover`, { status: 'a_fazer' })).json();
    expect(voltou.concluidoEm).toBeNull();

    const estado = await (await pedir('GET', '/estado')).json();
    expect(estado.tarefas).toHaveLength(1);
    expect(estado.config.arquivarAposDias).toBe(3);
  });

  it('recusa tarefa sem título e prazo em formato errado', async () => {
    const semTitulo = await pedir('POST', '/tarefas', { titulo: '   ' });
    expect(semTitulo.status).toBe(400);
    expect((await semTitulo.json()).erro).toBe('Dê um título para a tarefa');
    expect((await pedir('POST', '/tarefas', { titulo: 'x', prazo: '21/10/2026' })).status).toBe(400);
  });

  it('arquiva à mão só tarefas concluídas', async () => {
    const t = await (await pedir('POST', '/tarefas', { titulo: 'x' })).json();
    expect((await (await pedir('POST', `/tarefas/${t.id}/arquivar`)).json()).arquivadaEm).toBeNull();
    await pedir('POST', `/tarefas/${t.id}/mover`, { status: 'concluido' });
    expect((await (await pedir('POST', `/tarefas/${t.id}/arquivar`)).json()).arquivadaEm).toBeTruthy();
  });

  it('marca item do checklist e apaga a tarefa com tudo junto', async () => {
    const t = await (await pedir('POST', '/tarefas', { titulo: 'x', checklist: ['a'] })).json();
    const marcada = await (await pedir('PATCH', `/tarefas/${t.id}/checklist/${t.checklist[0].id}`, { feito: true })).json();
    expect(marcada.checklist[0].feito).toBe(true);
    expect((await pedir('DELETE', `/tarefas/${t.id}`)).status).toBe(204);
    expect((await pedir('PATCH', `/tarefas/${t.id}`, { titulo: 'y' })).status).toBe(404);
  });

  it('só aceita links http e https', async () => {
    const t = await (await pedir('POST', '/tarefas', { titulo: 'x' })).json();
    expect((await pedir('POST', `/tarefas/${t.id}/links`, { url: 'javascript:alert(1)' })).status).toBe(400);
    expect((await pedir('POST', `/tarefas/${t.id}/links`, { url: 'https://drive.google.com/x' })).status).toBe(201);
  });
});

describe('clientes e configuração', () => {
  it('não deixa cadastrar o mesmo cliente duas vezes', async () => {
    expect((await pedir('POST', '/clientes', { nome: 'Clínica Aurora' })).status).toBe(201);
    expect((await pedir('POST', '/clientes', { nome: 'clínica aurora' })).status).toBe(409);
  });
  it('aceita só os prazos de arquivamento previstos', async () => {
    expect((await pedir('PATCH', '/config', { arquivarAposDias: 5 })).status).toBe(400);
    expect((await (await pedir('PATCH', '/config', { arquivarAposDias: 7 })).json()).arquivarAposDias).toBe(7);
  });
});

describe('proteção do servidor local', () => {
  it('recusa pedidos de outro site aberto no navegador', async () => {
    const r = await pedir('POST', '/tarefas', { titulo: 'x' }, { ...LOCAL, origin: 'https://site-malicioso.com' });
    expect(r.status).toBe(403);
  });
  it('recusa Host de fora desta máquina (DNS rebinding)', async () => {
    const r = await pedir('GET', '/estado', undefined, { host: 'atacante.com:3333' });
    expect(r.status).toBe(403);
  });
  it('aceita a própria interface', async () => {
    const r = await pedir('POST', '/tarefas', { titulo: 'x' }, { ...LOCAL, origin: 'http://localhost:5173' });
    expect(r.status).toBe(201);
  });
});

describe('demandas não planejadas', () => {
  it('captura sem iniciar e recusa descrição vazia', async () => {
    const vazia = await pedir('POST', '/demandas', { descricao: '  ' });
    expect(vazia.status).toBe(400);
    expect((await vazia.json()).erro).toBe('Descreva o que foi pedido');

    const lista = await (await pedir('POST', '/demandas', { descricao: 'Ajustar logo do post', origem: 'Gestor', prioridade: 'urgente' })).json();
    expect(lista).toHaveLength(1);
    expect(lista[0]).toMatchObject({ origem: 'Gestor', prioridade: 'urgente', iniciadaEm: null, tempoMs: 0, concluidaEm: null });
    expect(lista[0].capturadaEm).toBeTruthy();

    const estado = await (await pedir('GET', '/estado')).json();
    expect(estado.demandas).toHaveLength(1);
    expect(estado.tarefas).toHaveLength(0); // não entra no planejamento
  });

  it('não inicia demanda que não existe', async () => {
    expect((await pedir('POST', '/demandas/nao-existe/iniciar')).status).toBe(404);
  });
});

describe('cronômetro das demandas', () => {
  const MIN = 60_000;
  let t: Date, repo: Repositorio;
  const passar = (min: number) => { t = new Date(t.getTime() + min * MIN); };
  const demanda = (id: string) => repo.listarDemandas().find((d) => d.id === id)!;
  beforeEach(() => { t = new Date('2026-10-22T13:00:00Z'); repo = new Repositorio(abrirBanco(':memory:'), () => t); });

  it('conta só o tempo em execução e preserva o tempo nas pausas', () => {
    const a = repo.capturarDemanda({ descricao: 'A' });
    passar(30); // pendente: não conta
    expect(demanda(a).tempoMs).toBe(0);
    repo.iniciarDemanda(a); passar(10); repo.pausarDemanda(a);
    expect(demanda(a).tempoMs).toBe(10 * MIN);
    passar(45); // pausada: não conta
    repo.iniciarDemanda(a); passar(5); repo.pausarDemanda(a);
    expect(demanda(a).tempoMs).toBe(15 * MIN);
  });

  it('iniciar outra demanda pausa a que estava em execução', () => {
    const a = repo.capturarDemanda({ descricao: 'A' }), b = repo.capturarDemanda({ descricao: 'B' });
    repo.iniciarDemanda(a); passar(8);
    repo.iniciarDemanda(b); passar(3);
    expect(demanda(a)).toMatchObject({ iniciadaEm: null, tempoMs: 8 * MIN });
    expect(repo.listarDemandas().filter((d) => d.iniciadaEm)).toHaveLength(1);
    repo.iniciarDemanda(b); // iniciar de novo a que já corre não zera o trecho
    passar(2); repo.pausarDemanda(b);
    expect(demanda(b).tempoMs).toBe(5 * MIN);
  });

  it('concluir fecha o tempo, registra a hora e mantém no histórico', () => {
    const a = repo.capturarDemanda({ descricao: 'A' });
    repo.iniciarDemanda(a); passar(12);
    expect(repo.concluirDemanda(a)).toBe(true);
    expect(demanda(a)).toMatchObject({ iniciadaEm: null, tempoMs: 12 * MIN, concluidaEm: t.toISOString() });
    expect(repo.iniciarDemanda(a)).toBe(false);
    expect(repo.concluirDemanda(a)).toBe(false);
    expect(repo.listarDemandas()).toHaveLength(1);
  });

  it('o trecho em andamento sobrevive a reabrir o banco', () => {
    const db = abrirBanco(':memory:');
    const r1 = new Repositorio(db, () => t);
    const a = r1.capturarDemanda({ descricao: 'A' });
    r1.iniciarDemanda(a); passar(20);
    const r2 = new Repositorio(db, () => t); // como depois de recarregar a página
    r2.pausarDemanda(a);
    expect(r2.listarDemandas()[0].tempoMs).toBe(20 * MIN);
  });
});

describe('nova tarefa: prazo, anexos e cliente', () => {
  const amanha = () => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toLocaleDateString('sv-SE'); };

  it('recusa prazo no passado ao criar', async () => {
    const r = await pedir('POST', '/tarefas', { titulo: 'x', prazo: '2020-01-01' });
    expect(r.status).toBe(400);
    expect((await r.json()).erro).toBe('Escolha um prazo de hoje em diante');
    expect((await pedir('POST', '/tarefas', { titulo: 'x', prazo: amanha() })).status).toBe(201);
  });

  it('anexa imagem, serve com o tipo certo e remove', async () => {
    const t = await (await pedir('POST', '/tarefas', { titulo: 'Com anexo' })).json();
    const png = new Uint8Array([137, 80, 78, 71, 1, 2, 3]);
    const r = await api.request(`/tarefas/${t.id}/anexos`, { method: 'POST', headers: { host: 'localhost:3333', 'content-type': 'image/png', 'x-nome': encodeURIComponent('referência.png') }, body: png });
    expect(r.status).toBe(201);
    const comAnexo = await r.json();
    expect(comAnexo.anexos).toEqual([{ id: expect.any(String), nome: 'referência.png', tipo: 'image/png', tamanho: 7, papel: 'material' }]);

    const arquivo = await pedir('GET', `/anexos/${comAnexo.anexos[0].id}`);
    expect(arquivo.headers.get('content-type')).toBe('image/png');
    expect(arquivo.headers.get('x-content-type-options')).toBe('nosniff');
    expect(new Uint8Array(await arquivo.arrayBuffer())).toEqual(png);

    const sem = await (await pedir('DELETE', `/tarefas/${t.id}/anexos/${comAnexo.anexos[0].id}`)).json();
    expect(sem.anexos).toEqual([]);
  });

  it('aceita material de qualquer tipo, mas só abre no navegador imagem, PDF e vídeo', async () => {
    const t = await (await pedir('POST', '/tarefas', { titulo: 'x' })).json();
    const enviar = (tipo: string, corpo: string, nome: string) => api.request(`/tarefas/${t.id}/anexos`, { method: 'POST', headers: { host: 'localhost:3333', 'content-type': tipo, 'x-nome': nome }, body: corpo });
    const html = await (await enviar('text/html', '<script>alert(1)</script>', 'pagina.html')).json();
    const servido = await pedir('GET', `/anexos/${html.anexos[0].id}`);
    expect(servido.headers.get('content-type')).toBe('application/octet-stream'); // nunca executa como página
    expect(servido.headers.get('content-disposition')).toMatch(/^attachment/);
    const video = await (await enviar('video/mp4', 'mp4', 'corte.mp4')).json();
    const v = await pedir('GET', `/anexos/${video.anexos[1].id}`);
    expect(v.headers.get('content-type')).toBe('video/mp4');
    expect(v.headers.get('content-disposition')).toMatch(/^inline/);
  });

  it('cliente é opcional na tarefa e é só um nome', async () => {
    const r = await pedir('POST', '/tarefas', { titulo: 'Sem cliente' });
    expect(r.status).toBe(201);
    expect((await r.json()).cliente).toBe('');
    const cli = await (await pedir('POST', '/clientes', { nome: 'Aurora' })).json();
    expect(cli).toEqual({ id: expect.any(String), nome: 'Aurora' });
  });
});

describe('acesso só desta máquina', () => {
  it('recusa pedido que veio por túnel, mesmo sem Origin e com Host local', async () => {
    const tunel = { host: 'localhost:3333', 'cf-connecting-ip': '203.0.113.9' };
    expect((await api.request('/estado', { headers: tunel })).status).toBe(403);
    expect((await api.request('/tarefas', { method: 'POST', headers: { ...tunel, 'content-type': 'application/json' }, body: JSON.stringify({ titulo: 'x' }) })).status).toBe(403);
    expect((await api.request('/estado', { headers: { host: 'localhost:3333', 'x-forwarded-for': '203.0.113.9' } })).status).toBe(403);
    expect((await api.request('/estado', { headers: { host: 'exemplo.com' } })).status).toBe(403);
    expect((await api.request('/estado', { headers: { host: 'localhost:5173' } })).status).toBe(200);
  });
});

describe('referências anexadas à mão', () => {
  it('ficam como referência e continuam no card ao concluir', async () => {
    const t = await (await pedir('POST', '/tarefas', { titulo: 'Local', status: 'fazendo' })).json();
    const comRef = await (await api.request(`/tarefas/${t.id}/anexos?papel=referencia`, { method: 'POST', headers: { host: 'localhost:3333', 'content-type': 'image/png', 'x-nome': 'moodboard.png' }, body: 'x' })).json();
    expect(comRef.anexos[0]).toMatchObject({ nome: 'moodboard.png', papel: 'referencia' });
    const concluida = await (await pedir('POST', `/tarefas/${t.id}/mover`, { status: 'concluido' })).json();
    expect(concluida.status).toBe('concluido');
    expect(concluida.anexos[0]).toMatchObject({ nome: 'moodboard.png', papel: 'referencia' });
  });
});

describe('desligar', () => {
  it('sem o atalho não existe; com o atalho responde e então desliga', async () => {
    expect((await (await pedir('GET', '/estado')).json()).desligavel).toBe(false);
    expect((await pedir('POST', '/desligar')).status).toBe(404);

    let desligou = false;
    api = criarApi(new Repositorio(abrirBanco(':memory:')), { desligar: () => { desligou = true; } });
    expect((await (await pedir('GET', '/estado')).json()).desligavel).toBe(true);
    expect((await pedir('POST', '/desligar')).status).toBe(204);
    expect(desligou).toBe(false); // responde antes, para a interface saber que deu certo
    await new Promise((r) => setTimeout(r, 200));
    expect(desligou).toBe(true);
  });

  it('outro site aberto no navegador não consegue desligar', async () => {
    api = criarApi(new Repositorio(abrirBanco(':memory:')), { desligar: () => { throw new Error('não devia desligar'); } });
    expect((await pedir('POST', '/desligar', undefined, { ...LOCAL, origin: 'https://site-qualquer.com' })).status).toBe(403);
  });
});

describe('atalho na área de trabalho', () => {
  it('fora do WSL não existe; no WSL cria e devolve onde ficou, e um erro chega com a mensagem', async () => {
    expect((await (await pedir('GET', '/estado')).json()).atalho).toBe(false);
    expect((await pedir('POST', '/atalho')).status).toBe(404);

    api = criarApi(new Repositorio(abrirBanco(':memory:')), { criarAtalho: async () => 'C:\\Users\\Ana\\Desktop\\DONELY.lnk' });
    expect((await (await pedir('GET', '/estado')).json()).atalho).toBe(true);
    expect(await (await pedir('POST', '/atalho')).json()).toEqual({ caminho: 'C:\\Users\\Ana\\Desktop\\DONELY.lnk' });

    api = criarApi(new Repositorio(abrirBanco(':memory:')), { criarAtalho: async () => { throw new Error('Sem powershell'); } });
    const r = await pedir('POST', '/atalho');
    expect(r.status).toBe(500);
    expect((await r.json()).erro).toBe('Sem powershell');
  });
});
