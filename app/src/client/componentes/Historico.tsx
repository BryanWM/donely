import { useEffect, useState } from 'react';
import {
  dataCurta, deslocarPeriodo, formatarDuracao, periodoDe, registrosDoPeriodo, rotuloDia, somarDias, tempoDemanda, textoRelatorio,
  type Demanda, type Periodo, type Tarefa, type TipoPeriodo,
} from '../../shared/dominio';
import type { Acoes } from '../acoes';
import logo from '../../../../brand/donely-icone.svg';
import { Icone } from './Icone';
import { Modal } from './Modal';

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const TIPOS: [TipoPeriodo, string][] = [['semana', 'Semana'], ['mes', 'Mês'], ['periodo', 'Período']];
const MOSTRAR = [['tudo', 'Tudo'], ['tarefa', 'Tarefas'], ['demanda', 'Não planejadas']] as const;
const hora = (iso: string) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
const data = (dia: string) => { const [a, m, d] = dia.split('-').map(Number); return new Date(a, m - 1, d); };
/** "19 a 25 de outubro de 2026", "28 de setembro a 4 de outubro de 2026" ou as duas datas completas. */
function periodoPorExtenso({ inicio, fim }: Periodo) {
  const i = data(inicio), f = data(fim), mes = (x: Date) => MESES[x.getMonth()];
  if (inicio === fim) return `${f.getDate()} de ${mes(f)} de ${f.getFullYear()}`;
  if (i.getFullYear() !== f.getFullYear()) return `${i.getDate()} de ${mes(i)} de ${i.getFullYear()} a ${f.getDate()} de ${mes(f)} de ${f.getFullYear()}`;
  return `${i.getDate()}${i.getMonth() === f.getMonth() ? '' : ` de ${mes(i)}`} a ${f.getDate()} de ${mes(f)} de ${f.getFullYear()}`;
}
const diaPorExtenso = (dia: string) => data(dia).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).replace(/^./, (c) => c.toUpperCase());

interface Props {
  tarefas: Tarefa[]; demandas: Demanda[]; hoje: string; acoes: Acoes;
  onAbrir: (id: string) => void; onAviso: (texto: string) => void;
}

/**
 * Tudo o que foi concluído no período, planejado ou não, pronto para copiar ou imprimir.
 * À esquerda, um painel fixo com período, números, filtro e ações; à direita, a lista por dia com a largura toda.
 */
export function Historico({ tarefas, demandas, hoje, acoes, onAbrir, onAviso }: Props) {
  const [demandaAberta, setDemandaAberta] = useState<Demanda | null>(null);
  // clicar em qualquer ponto da linha abre a prévia: o card da tarefa (só leitura) ou o resumo da não planejada
  const abrir = (tipo: 'tarefa' | 'demanda', id: string) => tipo === 'tarefa' ? onAbrir(id) : setDemandaAberta(demandas.find((d) => d.id === id) ?? null);
  const [tipo, setTipo] = useState<TipoPeriodo>('semana');
  const [periodo, setPeriodo] = useState<Periodo>(periodoDe('semana', hoje));
  const [mostrar, setMostrar] = useState<(typeof MOSTRAR)[number][0]>('tudo');
  // O navegador usa o título da página como nome do PDF: durante a impressão ele vira o do relatório, com o período.
  function imprimir() {
    const antes = document.title;
    document.title = `Relatório de atividades DONELY ${dataCurta(periodo.inicio).replaceAll('/', '-')} a ${dataCurta(periodo.fim).replaceAll('/', '-')}`;
    window.addEventListener('afterprint', () => { document.title = antes; }, { once: true });
    window.print();
  }
  const [busca, setBusca] = useState('');
  const [confirmar, setConfirmar] = useState<string | null>(null);

  useEffect(() => {
    if (!confirmar) return;
    const espera = setTimeout(() => setConfirmar(null), 4000);
    return () => clearTimeout(espera);
  }, [confirmar]);

  function trocarTipo(t: TipoPeriodo) {
    setTipo(t);
    setPeriodo(t === 'periodo' ? { inicio: somarDias(hoje, -29), fim: hoje } : periodoDe(t, hoje));
  }

  const q = busca.trim().toLowerCase();
  // os números do filtro contam o período com a busca, antes de escolher o que mostrar
  const doPeriodo = registrosDoPeriodo(tarefas, demandas, periodo)
    .filter((r) => !q || [r.titulo, r.quem, r.categoria].some((x) => x.toLowerCase().includes(q)));
  const contagem = { tudo: doPeriodo.length, tarefa: doPeriodo.filter((r) => r.tipo === 'tarefa').length, demanda: 0 };
  contagem.demanda = contagem.tudo - contagem.tarefa;
  const registros = doPeriodo.filter((r) => mostrar === 'tudo' || r.tipo === mostrar);
  const nTarefas = registros.filter((r) => r.tipo === 'tarefa').length;
  const nDemandas = registros.length - nTarefas;
  const tempo = registros.reduce((s, r) => s + (r.tempoMs ?? 0), 0);
  const dias = [...new Set(registros.map((r) => r.dia))];

  const atual = tipo !== 'periodo' && periodo.inicio === periodoDe(tipo, hoje).inicio;
  const anterior = tipo !== 'periodo' && periodo.inicio === deslocarPeriodo(tipo, periodoDe(tipo, hoje), -1).inicio;
  const [aI, mI, dI] = periodo.inicio.split('-'), [aF, mF, dF] = periodo.fim.split('-');
  const titulo = tipo === 'mes' ? MESES[Number(mI) - 1].replace(/^./, (c) => c.toUpperCase())
    : atual ? 'Esta semana' : anterior ? 'Semana passada' : 'Semana';
  const subtitulo = tipo === 'mes' ? aI
    : mI === mF ? `${Number(dI)} a ${Number(dF)} de ${MESES[Number(mF) - 1]}` : `${dI}/${mI} a ${dF}/${mF}${aI !== aF ? `/${aF}` : ''}`;
  // a semana dia a dia, com quantos itens cada um teve (clicar leva ao dia na lista)
  const semana = tipo === 'semana' ? Array.from({ length: 7 }, (_, i) => {
    const dia = somarDias(periodo.inicio, i);
    return { dia, sigla: rotuloDia(dia).split(',')[0], n: registros.filter((r) => r.dia === dia).length };
  }) : [];

  async function copiar() {
    try { await navigator.clipboard.writeText(textoRelatorio(registros, periodo)); onAviso('Relatório copiado. Cole no e-mail, chat ou documento.'); }
    catch { onAviso('O navegador não deixou copiar. Use Imprimir para salvar em PDF.'); }
  }

  async function excluir(id: string) {
    if (confirmar !== id) { setConfirmar(id); return; }
    setConfirmar(null);
    await acoes.excluir(id);
  }

  return (
    <>
    <div className="historico-tela">
      <aside className="historico-lado" aria-label="Período e filtros">
        <div className="segmentado so-tela" role="radiogroup" aria-label="Tipo de período">
          {TIPOS.map(([t, n]) => <button key={t} type="button" role="radio" aria-checked={tipo === t} className={tipo === t ? 'ativo' : ''} onClick={() => trocarTipo(t)}>{n}</button>)}
        </div>

        {tipo === 'periodo' ? (
          <div className="historico-intervalo so-tela">
            <label>De <input type="date" value={periodo.inicio} max={periodo.fim} onChange={(e) => e.target.value && setPeriodo({ ...periodo, inicio: e.target.value })} /></label>
            <label>Até <input type="date" value={periodo.fim} min={periodo.inicio} onChange={(e) => e.target.value && setPeriodo({ ...periodo, fim: e.target.value })} /></label>
          </div>
        ) : (
          <div className="historico-periodo so-tela">
            <button type="button" className="btn icone-so" onClick={() => setPeriodo(deslocarPeriodo(tipo, periodo, -1))} aria-label={tipo === 'semana' ? 'Semana anterior' : 'Mês anterior'}><Icone nome="anterior" /></button>
            <div><h2>{titulo}</h2><p>{subtitulo}</p></div>
            <button type="button" className="btn icone-so" onClick={() => setPeriodo(deslocarPeriodo(tipo, periodo, 1))} disabled={periodo.fim >= hoje} aria-label={tipo === 'semana' ? 'Próxima semana' : 'Próximo mês'}><Icone nome="proximo" /></button>
          </div>
        )}

        {semana.length > 0 && (
          <ol className="historico-semana so-tela" aria-label="Dias da semana">
            {semana.map((d) => (
              <li key={d.dia}>
                <button type="button" disabled={!d.n} className={d.dia === hoje ? 'hoje' : ''} aria-label={`${rotuloDia(d.dia)}: ${d.n} ${d.n === 1 ? 'item' : 'itens'}`}
                  onClick={() => document.getElementById(`dia-${d.dia}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                  <span>{d.sigla}</span><strong>{Number(d.dia.slice(8))}</strong><small>{d.n || '—'}</small>
                </button>
              </li>
            ))}
          </ol>
        )}

        <ul className="lista-ios historico-numeros" aria-label="Resumo do período">
          <li className="linha-ios"><span className="rotulo">{nTarefas === 1 ? 'Tarefa concluída' : 'Tarefas concluídas'}</span><strong>{nTarefas}</strong></li>
          <li className="linha-ios"><span className="rotulo">{nDemandas === 1 ? 'Não planejada' : 'Não planejadas'}</span><strong>{nDemandas}</strong></li>
          <li className="linha-ios"><span className="rotulo">Tempo fora do plano</span><strong>{formatarDuracao(tempo)}</strong></li>
        </ul>

      </aside>

      <section className="historico-lista" aria-label="Concluídas no período">
        {/* filtro e ações da lista ficam sobre ela: o painel da esquerda cabe sem rolar mesmo em 1366×768 com o navegador */}
        <div className="historico-ferramentas so-tela">
          <label className="busca historico-busca">
            <span className="sr">Buscar</span>
            <Icone nome="busca" /><input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por título, cliente ou quem pediu" />
          </label>
          <div className="segmentado" role="radiogroup" aria-label="Mostrar">
            {MOSTRAR.map(([v, n]) => (
              <button key={v} type="button" role="radio" aria-checked={mostrar === v} className={mostrar === v ? 'ativo' : ''} onClick={() => setMostrar(v)}>
                {n}<span className="contagem">{contagem[v]}</span>
              </button>
            ))}
          </div>
          <button type="button" className="btn principal" onClick={copiar}><Icone nome="lista" />Copiar relatório</button>
          <button type="button" className="btn" onClick={imprimir} aria-label="Imprimir ou salvar em PDF" title="Imprimir ou salvar em PDF"><Icone nome="arquivo" />PDF</button>
        </div>

        {registros.length ? dias.map((dia) => {
          const doDia = registros.filter((r) => r.dia === dia);
          return (
            <div key={dia} id={`dia-${dia}`} className="historico-dia">
              <h3>{rotuloDia(dia)}<span>{doDia.length} {doDia.length === 1 ? 'item' : 'itens'}</span></h3>
              <ul>
                {doDia.map((r) => (
                  <li key={r.tipo + r.id} className={`historico-item ${r.tipo}`} onClick={() => abrir(r.tipo, r.id)}>
                    <span className="historico-titulo">
                      <span className="historico-ponto" aria-hidden="true" />
                      <button type="button" className="texto-corte" onClick={(e) => { e.stopPropagation(); abrir(r.tipo, r.id); }} title={r.titulo}>{r.titulo}</button>
                    </span>
                    <span className="historico-meta texto-corte">
                      {r.quem || '—'} · {r.tipo === 'tarefa' ? r.categoria || 'Tarefa' : `Não planejada${r.tempoMs ? `, ${formatarDuracao(r.tempoMs)}` : ''}`}
                    </span>
                    <span className="historico-hora">{hora(r.concluidoEm)}</span>
                    <span className="historico-acoes-linha so-tela" onClick={(e) => e.stopPropagation()}>
                      {r.tipo === 'tarefa' && (<>
                        <button type="button" className="btn icone-so" onClick={() => acoes.mover(r.id, 'a_fazer')} aria-label={`Voltar ${r.titulo} ao quadro`} title="Voltar ao quadro"><Icone nome="desfazer" tamanho={15} /></button>
                        <button type="button" className={`btn perigo pequeno ${confirmar === r.id ? 'confirmando' : 'icone-so'}`} onClick={() => excluir(r.id)}
                          aria-label={confirmar === r.id ? 'Confirmar exclusão' : `Excluir ${r.titulo}`} title="Excluir">
                          {confirmar === r.id ? 'Confirmar' : <Icone nome="lixeira" tamanho={15} />}
                        </button>
                      </>)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        }) : (
          <div className="vazio-grande">
            <Icone nome="arquivo" tamanho={28} />
            <h3>Nada concluído neste período</h3>
            <p>{q || mostrar !== 'tudo' ? 'Nenhum registro com esses filtros.' : 'Tarefas concluídas e demandas não planejadas finalizadas aparecem aqui, por dia.'}</p>
            {(q || mostrar !== 'tudo') && <button type="button" className="btn texto pequeno" onClick={() => { setBusca(''); setMostrar('tudo'); }}>Limpar filtros</button>}
          </div>
        )}
      </section>
    </div>

    {/* Só na impressão (Imprimir ou PDF): relatório próprio, em tabela, que lê bem também em preto e branco. Segue os filtros da tela. */}
    <section className="relatorio" aria-label="Relatório para impressão">
      <header className="relatorio-cab">
        <img src={logo} alt="" width={34} height={34} />
        <div>
          <h1>Relatório de atividades</h1>
          <p>{periodoPorExtenso(periodo)}{mostrar !== 'tudo' && ` · só ${mostrar === 'tarefa' ? 'tarefas' : 'não planejadas'}`}{q && ` · busca: “${busca.trim()}”`}</p>
        </div>
        <p className="relatorio-gerado">DONELY<br />Gerado em {new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</p>
      </header>
      <dl className="relatorio-numeros">
        <div><dt>{nTarefas === 1 ? 'Tarefa concluída' : 'Tarefas concluídas'}</dt><dd>{nTarefas}</dd></div>
        <div><dt>{nDemandas === 1 ? 'Não planejada' : 'Não planejadas'}</dt><dd>{nDemandas}</dd></div>
        <div><dt>Tempo fora do plano</dt><dd>{formatarDuracao(tempo)}</dd></div>
      </dl>
      {registros.length ? dias.map((dia) => (
        <table key={dia} className="relatorio-dia">
          <caption>{diaPorExtenso(dia)}</caption>
          <thead><tr><th>Hora</th><th>O que foi feito</th><th>Cliente ou quem pediu</th><th>Tipo</th><th>Tempo</th></tr></thead>
          <tbody>
            {registros.filter((r) => r.dia === dia).map((r) => (
              <tr key={r.tipo + r.id}>
                <td>{hora(r.concluidoEm)}</td>
                <td>{r.titulo}</td>
                <td>{r.quem || '—'}</td>
                <td>{r.tipo === 'tarefa' ? r.categoria || 'Tarefa' : <strong>Não planejada</strong>}</td>
                <td>{r.tempoMs ? formatarDuracao(r.tempoMs) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )) : <p className="relatorio-vazio">Nada concluído neste período.</p>}
    </section>
    {demandaAberta && <PreviaDemanda demanda={demandaAberta} onFechar={() => setDemandaAberta(null)} />}
    </>
  );
}

const quando = (iso: string) => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/** Como a não planejada ficou ao ser finalizada: o pedido, quem pediu, o tempo gasto e o registro do que foi feito. */
function PreviaDemanda({ demanda: d, onFechar }: { demanda: Demanda; onFechar: () => void }) {
  const ms = tempoDemanda(d, Date.now());
  return (
    <Modal titulo="Não planejada" onFechar={onFechar} direita={<button type="button" className="btn texto forte" onClick={onFechar}>OK</button>}>
      <div className="previa-demanda">
        <h3>{d.descricao}{d.prioridade === 'urgente' && <span className="selo selo-erro">Urgente</span>}</h3>
        <ul className="lista-ios">
          <li className="linha-ios"><span className="rotulo">Quem pediu</span><span className="valor">{d.origem || '—'}</span></li>
          <li className="linha-ios"><span className="rotulo">Capturada</span><span className="valor">{quando(d.capturadaEm)}</span></li>
          {d.concluidaEm && <li className="linha-ios"><span className="rotulo">Finalizada</span><span className="valor">{quando(d.concluidaEm)}</span></li>}
          <li className="linha-ios"><span className="rotulo">Tempo em execução</span><span className="valor">{ms ? formatarDuracao(ms) : '—'}</span></li>
        </ul>
        <p className="grupo-titulo">O que foi feito</p>
        <div className="lista-ios previa-registro">{d.registro.trim() ? d.registro : <span className="sem-valor">Finalizada sem registro.</span>}</div>
      </div>
    </Modal>
  );
}
