import { describe, expect, it } from 'vitest';
import { diasParaArquivar, estaArquivada, ordenarTarefas, situacaoPrazo, somarDias } from './dominio';

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
