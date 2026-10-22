import { useEffect, useRef, type ReactNode } from 'react';

interface Props {
  titulo: string;
  /** Ação à esquerda do título (ex.: Cancelar). */
  esquerda?: ReactNode;
  /** Ação à direita. Sem ela, mostra "Concluído", que fecha a janela. */
  direita?: ReactNode;
  grande?: boolean;
  onFechar: () => void;
  children: ReactNode;
}

/** Janela no padrão de sheet do iOS: fecha no Esc, em Concluído ou clicando fora. */
export function Modal({ titulo, esquerda, direita, grande, onFechar, children }: Props) {
  const caixa = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null;
    caixa.current?.querySelector<HTMLElement>('.modal-corpo input, .modal-corpo textarea, .modal-corpo select, .modal-cab button')?.focus();
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') onFechar(); };
    document.addEventListener('keydown', tecla);
    return () => { document.removeEventListener('keydown', tecla); anterior?.focus(); };
  }, [onFechar]);

  return (
    <>
      <div className="fundo-modal" onClick={onFechar} />
      <div ref={caixa} className={`modal ${grande ? 'modal-grande' : ''}`} role="dialog" aria-modal="true" aria-label={titulo}>
        <header className="modal-cab">
          <span>{esquerda}</span>
          <h2>{titulo}</h2>
          {direita ?? <button type="button" className="btn texto forte" onClick={onFechar}>Concluído</button>}
        </header>
        <div className="modal-corpo">{children}</div>
      </div>
    </>
  );
}
