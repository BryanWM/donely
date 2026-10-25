import { useEffect, useRef, type ReactNode } from 'react';

interface Props {
  titulo: string;
  /** Ação à esquerda do título (ex.: Cancelar). */
  esquerda?: ReactNode;
  /** Ação à direita. Sem ela, mostra "Fechar". */
  direita?: ReactNode;
  grande?: boolean;
  largo?: boolean;
  /** Ações no rodapé. Com rodapé, o cabeçalho mostra só o título. */
  rodape?: ReactNode;
  onFechar: () => void;
  children: ReactNode;
}

/** Janela no padrão de sheet do iOS: fecha no Esc, em Fechar ou clicando fora. */
export function Modal({ titulo, esquerda, direita, grande, largo, rodape, onFechar, children }: Props) {
  const caixa = useRef<HTMLDivElement>(null);
  // Guardado numa ref: o pai recria onFechar a cada render, e o efeito abaixo deve rodar só ao abrir.
  // (Rodando de novo, ele devolvia o foco ao primeiro campo e a página rolava para o topo.)
  const fechar = useRef(onFechar);
  fechar.current = onFechar;

  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null;
    // Primeiro campo do corpo; sem campo, o botão do cabeçalho. (Uma lista única de seletores pegaria o cabeçalho, que vem antes no DOM.)
    // No card (grande) o foco vai direto ao Fechar: abre-se para ler, e focar o título acendia o anel toda vez.
    const c = caixa.current;
    const campo = grande ? null : c?.querySelector<HTMLElement>('.modal-corpo :is(input, textarea, select)');
    (campo ?? c?.querySelector<HTMLElement>('.modal-cab button'))?.focus();
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') fechar.current(); };
    document.addEventListener('keydown', tecla);
    return () => { document.removeEventListener('keydown', tecla); anterior?.focus(); };
  }, []);

  return (
    <>
      <div className="fundo-modal" onClick={onFechar} />
      <div ref={caixa} className={`modal ${grande ? 'modal-grande' : ''} ${largo ? 'modal-largo' : ''}`} role="dialog" aria-modal="true" aria-label={titulo}>
        <header className="modal-cab">
          <span>{esquerda}</span>
          <h2>{titulo}</h2>
          {rodape ? <span /> : direita ?? <button type="button" className="btn texto forte" onClick={onFechar}>Fechar</button>}
        </header>
        <div className="modal-corpo">{children}</div>
        {rodape && <footer className="modal-rodape">{rodape}</footer>}
      </div>
    </>
  );
}
