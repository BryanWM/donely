// A tarefa "viaja" até a aba de destino quando muda de etapa: uma cópia da linha faz um arco até a aba,
// encolhendo, e a aba recebe com um leve salto e o contador pulsando. Só voa depois que a ação deu certo.

const PULSO = { duration: 700, easing: 'cubic-bezier(0.33, 1, 0.68, 1)' };

/** Pulso do contador (verde e maior por um instante). Usado aqui na chegada e pelo contador quando muda sozinho. */
export function pulsarContagem(el: Element | null | undefined) {
  el?.animate([{ transform: 'scale(1.6)', color: 'var(--acao)' }, { transform: 'none' }], PULSO);
}

/**
 * Prepara o voo no clique (a linha ainda está na tela: guarda a cópia e a posição) e devolve a função que o lança.
 * Quem chama lança só se a linha saiu da lista, ou seja, se a ação deu certo; senão chama com `false` para desistir.
 */
export function prepararVoo(linha: HTMLElement | null, destinoId: string): ((voar: boolean) => void) | undefined {
  const aba = document.getElementById(destinoId);
  if (!linha || !aba || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const de = linha.getBoundingClientRect();
  const copia = linha.cloneNode(true) as HTMLElement;
  copia.removeAttribute('id');
  copia.setAttribute('aria-hidden', 'true');
  copia.inert = true; // a cópia tem botões: fora do foco e do leitor de tela
  copia.classList.add('voo');
  // fora da lista a cópia perde as colunas (--colunas mora em .lista-cartoes): leva o grid e o fundo já calculados
  const css = getComputedStyle(linha);
  Object.assign(copia.style, { left: `${de.left}px`, top: `${de.top}px`, width: `${de.width}px`, height: `${de.height}px`,
    gridTemplateColumns: css.gridTemplateColumns, background: css.background });
  // desde o clique, a aba segura o pulso do contador: ele vem na chegada
  aba.dataset.chegando = '1';

  return (voar) => {
    const soltar = () => { delete aba.dataset.chegando; pulsarContagem(aba.querySelector('.contagem')); };
    if (!voar) { delete aba.dataset.chegando; return; } // a ação falhou: nada mudou, nada pulsa
    document.body.append(copia);
    const para = aba.getBoundingClientRect();
    const dx = para.left + para.width / 2 - (de.left + de.width / 2);
    const dy = para.top + para.height / 2 - (de.top + de.height / 2);
    const voo = copia.animate([
      { transform: 'none', opacity: 1 },
      { transform: `translate(${dx * 0.12}px, ${dy * 0.1 - 14}px) scale(0.94)`, opacity: 1, offset: 0.3 },
      { transform: `translate(${dx}px, ${dy}px) scale(${Math.max(0.12, para.width / de.width)})`, opacity: 0.15 },
    ], { duration: 680, easing: 'cubic-bezier(0.55, 0, 0.25, 1)', fill: 'forwards' });
    const chegar = () => {
      copia.remove();
      aba.animate([{ transform: 'none' }, { transform: 'translateY(-4px)' }, { transform: 'none' }], { duration: 320, easing: 'ease-out' });
      soltar();
    };
    voo.finished.then(chegar, chegar);
  };
}
