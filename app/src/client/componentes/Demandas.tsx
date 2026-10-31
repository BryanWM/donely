import { useEffect, useState, type FormEvent } from 'react';
import { diaLocal, estadoDemanda, formatarDuracao, somarDias, tempoDemanda, type Demanda } from '../../shared/dominio';
import type { Acoes } from '../acoes';
import { Icone } from './Icone';

/** Relógio que só bate (a cada segundo) enquanto `ativo`; parado, não gasta nada. */
export function useAgora(ativo: boolean) {
  const [agora, setAgora] = useState(Date.now());
  useEffect(() => {
    if (!ativo) return;
    setAgora(Date.now());
    const i = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(i);
  }, [ativo]);
  return agora;
}

const hora = (iso: string) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
const diaDe = (iso: string) => diaLocal(new Date(iso));
const ORDEM = { em_execucao: 0, pendente: 1, concluida: 2 };

interface Props { demandas: Demanda[]; hoje: string; acoes: Acoes; onCapturar: () => void }

export function Demandas({ demandas, hoje, acoes, onCapturar }: Props) {
  const [dia, setDia] = useState(hoje);
  const agora = useAgora(demandas.some((d) => d.iniciadaEm));
  // registro aberto: finalizar (com o que foi feito) ou escrever/corrigir o registro de uma já finalizada
  const [registrando, setRegistrando] = useState<{ id: string; texto: string; finalizar: boolean } | null>(null);
  const [gravando, setGravando] = useState(false);

  async function gravarRegistro(e: FormEvent) {
    e.preventDefault();
    if (!registrando || gravando) return;
    setGravando(true);
    try { if (await acoes.registroDemanda(registrando.id, registrando.texto, registrando.finalizar)) setRegistrando(null); }
    finally { setGravando(false); }
  }

  const doDia = demandas.filter((d) => diaDe(d.capturadaEm) === dia)
    .sort((a, b) => ORDEM[estadoDemanda(a)] - ORDEM[estadoDemanda(b)] || b.capturadaEm.localeCompare(a.capturadaEm));
  // O que ficou aberto de dias anteriores continua à mão no dia de hoje.
  const deAntes = dia === hoje ? demandas.filter((d) => !d.concluidaEm && diaDe(d.capturadaEm) < hoje) : [];
  const concluidas = doDia.filter((d) => d.concluidaEm).length;
  const total = doDia.reduce((s, d) => s + tempoDemanda(d, agora), 0);
  const rotuloDia = dia === hoje ? 'Hoje' : dia === somarDias(hoje, -1) ? 'Ontem'
    : new Date(`${dia}T12:00`).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });

  const linha = (d: Demanda) => {
    const estado = estadoDemanda(d), ms = tempoDemanda(d, agora);
    return (
      <li key={d.id} className={`linha-demanda ${estado === 'em_execucao' ? 'executando' : ''} ${estado === 'concluida' ? 'feita' : d.prioridade === 'urgente' ? 'urgente' : ''}`}>
        <span className="cel cel-descricao">
          <span className="descricao">{d.descricao}</span>
          {d.prioridade === 'urgente' && <span className="selo selo-erro">Urgente</span>}
          {d.registro && registrando?.id !== d.id && <span className="registro-demanda" title={d.registro}>{d.registro}</span>}
        </span>
        <span className="cel texto-2">{d.origem || <span className="sem-valor">—</span>}</span>
        <span className="cel texto-2 numero">{hora(d.capturadaEm)}</span>
        <span className="cel">
          {estado === 'em_execucao' ? <span className="estado estado-execucao"><span className="pulso" aria-hidden="true" />Em execução</span>
            : estado === 'concluida' ? <span className="estado">Concluída às {hora(d.concluidaEm!)}</span>
            : <span className="estado estado-pendente">{d.tempoMs ? 'Pausada' : 'Pendente'}</span>}
        </span>
        <span className="cel numero tempo">{estado === 'em_execucao' ? formatarDuracao(ms, true) : ms ? formatarDuracao(ms) : <span className="sem-valor">—</span>}</span>
        <span className="cel acoes-demanda">
          {estado === 'em_execucao' && <button type="button" className="btn pequeno" onClick={() => acoes.cronometro(d.id, 'pausar')}><Icone nome="pausa" tamanho={14} />Pausar</button>}
          {estado === 'pendente' && <button type="button" className="btn pequeno contorno" onClick={() => acoes.cronometro(d.id, 'iniciar')}><Icone nome="play" tamanho={14} />{d.tempoMs ? 'Retomar' : 'Iniciar'}</button>}
          {estado !== 'concluida' && <button type="button" className="btn pequeno texto" onClick={() => setRegistrando({ id: d.id, texto: d.registro, finalizar: true })} aria-label={`Finalizar ${d.descricao}`}><Icone nome="check" tamanho={14} />Finalizar</button>}
          {estado === 'concluida' && registrando?.id !== d.id && (
            <button type="button" className="btn pequeno texto" onClick={() => setRegistrando({ id: d.id, texto: d.registro, finalizar: false })} aria-label={`${d.registro ? 'Editar' : 'Adicionar'} registro de ${d.descricao}`}>
              <Icone nome="lista" tamanho={14} />{d.registro ? 'Editar registro' : 'Adicionar registro'}
            </button>
          )}
        </span>
        {registrando?.id === d.id && (
          <form className="registro-form" onSubmit={gravarRegistro} onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) gravarRegistro(e); if (e.key === 'Escape') { e.stopPropagation(); setRegistrando(null); } }}>
            <label htmlFor={`registro-${d.id}`}>O que foi feito? <span className="texto-2">(opcional)</span></label>
            <textarea id={`registro-${d.id}`} rows={2} value={registrando.texto} onChange={(e) => setRegistrando({ ...registrando, texto: e.target.value })}
              placeholder="Ex.: troquei a foto e avisei no grupo do cliente." autoFocus />
            <span className="registro-botoes">
              <button type="button" className="btn texto pequeno" onClick={() => setRegistrando(null)}>Cancelar</button>
              <button type="submit" className="btn principal pequeno" disabled={gravando} title="Ctrl+Enter">{registrando.finalizar ? (gravando ? 'Finalizando…' : 'Finalizar') : (gravando ? 'Salvando…' : 'Salvar registro')}</button>
            </span>
          </form>
        )}
      </li>
    );
  };

  const cabecalho = (
    <div className="lista-cab" aria-hidden="true"><span>Demanda</span><span>Quem pediu</span><span>Capturada</span><span>Estado</span><span>Tempo</span><span /></div>
  );

  return (
    <>
      <section className="resumo-dia" aria-labelledby="resumo-titulo">
        <div className="navegar-dia">
          <button type="button" className="btn icone-so" onClick={() => setDia(somarDias(dia, -1))} aria-label="Dia anterior"><Icone nome="anterior" /></button>
          <h2 id="resumo-titulo">{rotuloDia}</h2>
          <button type="button" className="btn icone-so" onClick={() => setDia(somarDias(dia, 1))} disabled={dia >= hoje} aria-label="Próximo dia"><Icone nome="proximo" /></button>
          {dia !== hoje && <button type="button" className="btn texto pequeno" onClick={() => setDia(hoje)}>Voltar para hoje</button>}
        </div>
        <ul className="numeros-dia" aria-label="Resumo do expediente">
          <li><strong>{doDia.length}</strong>{doDia.length === 1 ? 'capturada' : 'capturadas'}</li>
          <li><strong>{concluidas}</strong>{concluidas === 1 ? 'concluída' : 'concluídas'}</li>
          <li><strong>{formatarDuracao(total)}</strong>em demandas não planejadas</li>
        </ul>
        <button type="button" className="btn principal" onClick={onCapturar}><Icone nome="raio" />Captura rápida</button>
      </section>

      <div className="lista-cartoes lista-demandas">
        {(doDia.length > 0 || deAntes.length > 0) && cabecalho}
        {deAntes.length > 0 && (
          <>
            <h3 className="titulo-secao">Em aberto de dias anteriores <span className="contagem">{deAntes.length}</span></h3>
            <ul className="lista-simples">{deAntes.map(linha)}</ul>
            <h3 className="titulo-secao">Capturadas hoje <span className="contagem">{doDia.length}</span></h3>
          </>
        )}
        {doDia.length ? (
          <ul className="lista-simples">{doDia.map(linha)}</ul>
        ) : (
          <div className="vazio">
            <p>{dia === hoje ? 'Nenhuma demanda inesperada hoje. Quando alguém pedir algo de última hora, registre em segundos.' : 'Nenhuma demanda capturada neste dia.'}</p>
            {dia === hoje && <button type="button" className="btn texto pequeno" onClick={onCapturar}><Icone nome="raio" tamanho={14} />Captura rápida</button>}
          </div>
        )}
        <p className="nota-demandas">O tempo conta só enquanto a demanda está em execução. Uma de cada vez: iniciar outra pausa a atual.</p>
      </div>
    </>
  );
}
