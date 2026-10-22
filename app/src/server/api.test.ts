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
