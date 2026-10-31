import { useRef, useState } from 'react';
import type { Cliente, Tarefa } from '../../shared/dominio';
import type { Acoes } from '../acoes';
import { Modal } from './Modal';
import { NotasPessoas } from './NotasPessoas';
import { Rascunhos } from './Rascunhos';

export type SecaoCaderno = 'pessoas' | 'ideias';
type Aviso = (texto: string, extra?: { erro?: boolean; acao?: { rotulo: string; fn: () => void } }) => void;
interface Props {
  secao: SecaoCaderno; onSecao: (s: SecaoCaderno) => void; hoje: string; tarefas: Tarefa[]; clientes: Cliente[]; acoes: Acoes;
  onAbrirTarefa: (id: string) => void; onAviso: Aviso; onFechar: () => void;
}
const SECOES: [SecaoCaderno, string][] = [['pessoas', 'Pessoas'], ['ideias', 'Ideias']];

/**
 * Caderno (tecla N): um só acesso para duas áreas independentes, Pessoas e Ideias, cada uma com seus dados e editores.
 * As duas ficam montadas (só a ativa aparece), então alternar não perde o que está sendo escrito.
 * Fechar só acontece depois que as duas confirmam que salvaram o pendente.
 */
export function Caderno({ secao, onSecao, hoje, tarefas, clientes, acoes, onAbrirTarefa, onAviso, onFechar }: Props) {
  const guardas = useRef<Record<SecaoCaderno, () => Promise<boolean>>>({ pessoas: async () => true, ideias: async () => true });
  const [fechando, setFechando] = useState(false);

  async function liberar() {
    if (fechando) return false;
    setFechando(true);
    try {
      const ok = (await guardas.current.pessoas()) && (await guardas.current.ideias());
      if (!ok) onAviso('Não foi possível salvar tudo. O Caderno continua aberto com suas alterações: tente de novo.', { erro: true });
      return ok;
    } finally { setFechando(false); }
  }
  async function fechar() { if (await liberar()) onFechar(); }
  // abrir uma tarefa a partir das Ideias: salva, fecha o Caderno e abre o card (os dois não se sobrepõem)
  async function abrirTarefa(id: string) { if (await liberar()) { onFechar(); onAbrirTarefa(id); } }

  const abas = (
    <span className="segmentado caderno-secoes" role="tablist" aria-label="Áreas do Caderno">
      {SECOES.map(([s, nome]) => (
        <button key={s} id={`caderno-aba-${s}`} type="button" role="tab" aria-selected={secao === s} aria-controls={`caderno-${s}`}
          className={secao === s ? 'ativo' : ''} onClick={() => onSecao(s)}>{nome}</button>
      ))}
    </span>
  );

  return (
    <Modal cheio titulo="Caderno" esquerda={abas} onFechar={fechar}>
      <div id="caderno-pessoas" className="caderno-painel" role="tabpanel" aria-labelledby="caderno-aba-pessoas" hidden={secao !== 'pessoas'}>
        <NotasPessoas hoje={hoje} onAviso={onAviso} registrarGuarda={(fn) => { guardas.current.pessoas = fn; }} />
      </div>
      <div id="caderno-ideias" className="caderno-painel" role="tabpanel" aria-labelledby="caderno-aba-ideias" hidden={secao !== 'ideias'}>
        <Rascunhos tarefas={tarefas} clientes={clientes} hoje={hoje} acoes={acoes} onAbrir={abrirTarefa} onAviso={onAviso}
          registrarGuarda={(fn) => { guardas.current.ideias = fn; }} />
      </div>
    </Modal>
  );
}
