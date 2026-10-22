import { Fragment, useEffect, useState } from 'react';
import { diaLocal, estaArquivada, inicioDaSemana, somarDias, type Config, type Tarefa } from '../../shared/dominio';
import type { Acoes } from '../acoes';
import { Icone } from './Icone';

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const curta = (dia: string) => { const [, m, d] = dia.split('-'); return `${d}/${m}`; };

interface Props { tarefas: Tarefa[]; config: Config; hoje: string; acoes: Acoes; onAbrir: (id: string) => void }

export function Feitas({ tarefas, config, hoje, acoes, onAbrir }: Props) {
  const [busca, setBusca] = useState('');
  const [cliente, setCliente] = useState('');
  const [mes, setMes] = useState('');
  const [confirmar, setConfirmar] = useState<string | null>(null);

  useEffect(() => {
    if (!confirmar) return;
    const espera = setTimeout(() => setConfirmar(null), 4000);
    return () => clearTimeout(espera);
  }, [confirmar]);

  const todas = tarefas.filter((t) => estaArquivada(t, config.arquivarAposDias, hoje))
    .sort((a, b) => (b.concluidoEm ?? '').localeCompare(a.concluidoEm ?? ''));
  const dia = (t: Tarefa) => diaLocal(new Date(t.concluidoEm!));
  const meses = [...new Set(todas.map((t) => dia(t).slice(0, 7)))];
  const clientes = [...new Set(todas.map((t) => t.cliente).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const q = busca.trim().toLowerCase();
  const lista = todas.filter((t) => (!cliente || t.cliente === cliente) && (!mes || dia(t).startsWith(mes))
    && (!q || [t.titulo, t.cliente, t.notas].some((x) => x.toLowerCase().includes(q))));

  const semana = inicioDaSemana(hoje), anterior = somarDias(semana, -7);
  const rotulo = (t: Tarefa) => {
    const d = dia(t);
    if (d >= semana) return 'Esta semana';
    if (d >= anterior) return 'Semana passada';
    const i = inicioDaSemana(d);
    return `Semana de ${curta(i)} a ${curta(somarDias(i, 6))}`;
  };
  const grupos: { rotulo: string; itens: Tarefa[] }[] = [];
  for (const t of lista) {
    const r = rotulo(t);
    const g = grupos.find((x) => x.rotulo === r);
    if (g) g.itens.push(t); else grupos.push({ rotulo: r, itens: [t] });
  }

  async function excluir(id: string) {
    if (confirmar !== id) { setConfirmar(id); return; }
    setConfirmar(null);
    await acoes.excluir(id);
  }

  return (
    <>
      <div className="barra-filtros">
        <label>Buscar
          <span className="busca"><Icone nome="busca" /><input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Título, cliente ou nota" /></span>
        </label>
        <label>Cliente
          <select value={cliente} onChange={(e) => setCliente(e.target.value)}>
            <option value="">Todos</option>{clientes.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label>Mês
          <select value={mes} onChange={(e) => setMes(e.target.value)}>
            <option value="">Todos</option>
            {meses.map((m) => { const [a, mm] = m.split('-'); return <option key={m} value={m}>{MESES[Number(mm) - 1]} de {a}</option>; })}
          </select>
        </label>
      </div>

      {lista.length ? (
        <div className="area-tabela">
          <table className="tabela">
            <thead><tr><th>Tarefa</th><th>Cliente</th><th>Tipo</th><th>Concluída em</th><th>Ações</th></tr></thead>
            <tbody>
              {grupos.map((g) => (
                <Fragment key={g.rotulo}>
                  <tr className="grupo"><td colSpan={5}>{g.rotulo} · {g.itens.length}</td></tr>
                  {g.itens.map((t) => (
                    <tr key={t.id}>
                      <td><button type="button" className="link-titulo" onClick={() => onAbrir(t.id)}>{t.titulo}</button></td>
                      <td>{t.cliente || '—'}</td>
                      <td>{t.tipo || '—'}</td>
                      <td className="data">{curta(dia(t))}</td>
                      <td>
                        <span className="acoes-linha">
                          <button type="button" className="btn texto pequeno" onClick={() => acoes.mover(t.id, 'a_fazer')}><Icone nome="desfazer" tamanho={14} />Voltar ao quadro</button>
                          <button type="button" className={`btn perigo pequeno ${confirmar === t.id ? 'confirmando' : 'icone-so'}`} onClick={() => excluir(t.id)}
                            aria-label={confirmar === t.id ? 'Confirmar exclusão' : `Excluir ${t.titulo}`} title="Excluir">
                            {confirmar === t.id ? 'Confirmar exclusão' : <Icone nome="lixeira" tamanho={15} />}
                          </button>
                        </span>
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="vazio-grande">
          <Icone nome="arquivo" tamanho={28} />
          <h3>{todas.length ? 'Nada encontrado' : 'Ainda não há tarefas feitas'}</h3>
          <p>{todas.length ? 'Nenhuma tarefa feita com esses filtros.' : `Quando você concluir uma tarefa, ela fica ${config.arquivarAposDias === 1 ? 'até o dia seguinte' : `${config.arquivarAposDias} dias`} no quadro e depois vem para cá.`}</p>
        </div>
      )}
    </>
  );
}
