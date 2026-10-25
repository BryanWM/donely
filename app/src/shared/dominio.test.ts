import { describe, expect, it } from 'vitest';
import { deslocarPeriodo, periodoDe, registrosDoPeriodo, textoRelatorio, type Demanda, type Tarefa } from './dominio';
import { diasParaArquivar, estadoDemanda, estaArquivada, formatarDuracao, ordenarTarefas, situacaoPrazo, somarDias, tempoDemanda } from './dominio';

const HOJE = '2026-10-21';
const concluidaHa = (dias: number) => { const d = new Date(2026, 9, 21, 15, 0); d.setDate(d.getDate() - dias); return d.toISOString(); };

describe('arquivamento automático', () => {
  it('não arquiva tarefa que não está concluída', () => {
    expect(estaArquivada({ status: 'fazendo', concluidoEm: null, arquivadaEm: null }, 3, HOJE)).toBe(false);
  });
  it('arquiva quando passa o número de dias configurado', () => {
    const t = (dias: number) => ({ status: 'concluido' as const, concluidoEm: concluidaHa(dias), arquivadaEm: null });
    expect(estaArquivada(t(2), 3, HOJE)).toBe(false);
    expect(estaArquivada(t(3), 3, HOJE)).toBe(true);
    expect(estaArquivada(t(1), 1, HOJE)).toBe(true);
  });
  it('arquiva na hora quando foi arquivada à mão', () => {
    expect(estaArquivada({ status: 'concluido', concluidoEm: concluidaHa(0), arquivadaEm: concluidaHa(0) }, 14, HOJE)).toBe(true);
  });
  it('conta quantos dias faltam', () => {
    expect(diasParaArquivar({ concluidoEm: concluidaHa(0) }, 3, HOJE)).toBe(3);
    expect(diasParaArquivar({ concluidoEm: concluidaHa(2) }, 3, HOJE)).toBe(1);
  });
});

describe('prazo', () => {
  it('identifica atrasada, hoje e futuro', () => {
    expect(situacaoPrazo({ status: 'a_fazer', prazo: somarDias(HOJE, -2) }, HOJE)).toEqual({ tipo: 'atrasada', dias: 2 });
    expect(situacaoPrazo({ status: 'a_fazer', prazo: HOJE }, HOJE)).toEqual({ tipo: 'hoje' });
    expect(situacaoPrazo({ status: 'a_fazer', prazo: somarDias(HOJE, 5) }, HOJE)).toEqual({ tipo: 'futuro', dias: 5 });
  });
  it('ignora prazo de tarefa concluída ou sem prazo', () => {
    expect(situacaoPrazo({ status: 'concluido', prazo: somarDias(HOJE, -2) }, HOJE)).toBeNull();
    expect(situacaoPrazo({ status: 'a_fazer', prazo: null }, HOJE)).toBeNull();
  });
});

describe('ordem do quadro', () => {
  it('põe atrasadas primeiro, depois prioridade e prazo', () => {
    const base = { status: 'a_fazer' as const, criadoEm: '2026-10-01T10:00:00Z' };
    const lista = [
      { ...base, id: 'normal-sem-prazo', prioridade: 'normal' as const, prazo: null },
      { ...base, id: 'urgente-futuro', prioridade: 'urgente' as const, prazo: somarDias(HOJE, 3) },
      { ...base, id: 'normal-atrasada', prioridade: 'normal' as const, prazo: somarDias(HOJE, -1) },
      { ...base, id: 'normal-amanha', prioridade: 'normal' as const, prazo: somarDias(HOJE, 1) },
    ];
    expect(ordenarTarefas(lista, HOJE).map((t) => t.id)).toEqual(['normal-atrasada', 'urgente-futuro', 'normal-amanha', 'normal-sem-prazo']);
  });
});

describe('tempo das demandas', () => {
  const inicio = '2026-10-22T13:00:00.000Z', agora = Date.parse(inicio) + 90_000;
  it('soma o trecho em andamento ao tempo fechado', () => {
    expect(tempoDemanda({ tempoMs: 60_000, iniciadaEm: inicio }, agora)).toBe(150_000);
    expect(tempoDemanda({ tempoMs: 60_000, iniciadaEm: null }, agora)).toBe(60_000);
  });
  it('deduz o estado', () => {
    expect(estadoDemanda({ iniciadaEm: null, concluidaEm: null })).toBe('pendente');
    expect(estadoDemanda({ iniciadaEm: inicio, concluidaEm: null })).toBe('em_execucao');
    expect(estadoDemanda({ iniciadaEm: null, concluidaEm: inicio })).toBe('concluida');
  });
  it('formata a duração', () => {
    expect(formatarDuracao(0)).toBe('0 min');
    expect(formatarDuracao(30_000)).toBe('menos de 1 min');
    expect(formatarDuracao(12 * 60_000)).toBe('12 min');
    expect(formatarDuracao(65 * 60_000)).toBe('1 h 05 min');
    expect(formatarDuracao(754_000, true)).toBe('0:12:34');
  });
});

describe('histórico por período', () => {
  it('calcula semana (segunda a domingo) e mês, e navega entre eles', () => {
    expect(periodoDe('semana', '2026-10-22')).toEqual({ inicio: '2026-10-19', fim: '2026-10-25' });
    expect(periodoDe('mes', '2026-02-10')).toEqual({ inicio: '2026-02-01', fim: '2026-02-28' });
    expect(deslocarPeriodo('semana', periodoDe('semana', '2026-10-22'), -1)).toEqual({ inicio: '2026-10-12', fim: '2026-10-18' });
    expect(deslocarPeriodo('mes', periodoDe('mes', '2026-01-15'), -1)).toEqual({ inicio: '2025-12-01', fim: '2025-12-31' });
  });

  const tarefa = (titulo: string, status: Tarefa['status'], concluidoEm: string | null) =>
    ({ id: titulo, titulo, status, concluidoEm, cliente: 'Aurora', tipo: 'Post' }) as Tarefa;
  const demanda = (descricao: string, concluidaEm: string | null, tempoMs: number) =>
    ({ id: descricao, descricao, origem: 'Gestor', concluidaEm, tempoMs }) as Demanda;

  it('junta tarefas e demandas concluídas dentro do período, da mais recente para a mais antiga', () => {
    const r = registrosDoPeriodo(
      [tarefa('Dentro', 'concluido', '2026-10-20T15:00:00'), tarefa('Fora', 'concluido', '2026-10-10T15:00:00'), tarefa('Aberta', 'fazendo', null)],
      [demanda('Pedido', '2026-10-21T10:00:00', 25 * 60_000), demanda('Pendente', null, 0)],
      { inicio: '2026-10-19', fim: '2026-10-25' });
    expect(r.map((x) => x.titulo)).toEqual(['Pedido', 'Dentro']);
    expect(r[0]).toMatchObject({ tipo: 'demanda', quem: 'Gestor', tempoMs: 25 * 60_000 });
  });

  it('gera o texto do relatório agrupado por dia', () => {
    const p = { inicio: '2026-10-19', fim: '2026-10-25' };
    const texto = textoRelatorio(registrosDoPeriodo([tarefa('Carrossel', 'concluido', '2026-10-20T15:00:00')], [demanda('Trocar foto', '2026-10-20T16:00:00', 25 * 60_000)], p), p);
    expect(texto).toBe([
      'Relatório de atividades: 19/10/2026 a 25/10/2026',
      '1 tarefa concluída · 1 demanda não planejada (25 min)',
      '', 'ter, 20/10',
      '- [Não planejada] Trocar foto (pedido por Gestor · 25 min)',
      '- Carrossel (Aurora · Post)',
    ].join('\n'));
  });
});
