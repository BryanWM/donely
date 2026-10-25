import { useEffect, type CSSProperties } from 'react';

// Linhas da caderneta (y no viewBox da logo) e partículas que saem do check.
const LINHAS = [150, 182, 214, 246, 278, 310];
const PARTICULAS = Array.from({ length: 16 }, (_, i) => {
  const ang = (i / 16) * Math.PI * 2;
  const dist = 140 + (i % 3) * 40;
  return { x: Math.cos(ang) * dist, y: Math.sin(ang) * dist, cor: ['#8BD15A', '#2F9E5B', '#F5F8EE'][i % 3], r: 7 + (i % 2) * 4 };
});
const DURACAO = 5600;

/** Comemoração de tarefa concluída: a caderneta da logo surge, o lápis escreve, as linhas viram o check e o nome aparece. */
export function Comemoracao({ onFim }: { onFim: () => void }) {
  useEffect(() => { const t = setTimeout(onFim, DURACAO); return () => clearTimeout(t); }, [onFim]);

  return (
    <div className="comemoracao" role="status" aria-label="Tarefa concluída" onClick={onFim}>
      <svg className="com-logo" viewBox="10 8 380 380" aria-hidden="true">
        <g className="com-caderneta">
          <rect x="80" y="70" width="240" height="290" rx="34" fill="#173527" />
          <rect x="104" y="112" width="192" height="226" rx="16" fill="#F5F8EE" />
          <rect x="150" y="36" width="100" height="62" rx="20" fill="#8BD15A" />
          <rect x="176" y="56" width="48" height="16" rx="8" fill="#173527" />
        </g>
        {LINHAS.map((y, i) => (
          <path key={y} className="com-linha" d={`M132 ${y} H268`} pathLength={1} style={{ '--i': i, '--dy': `${226 - y}px` } as CSSProperties} />
        ))}
        <path className="com-check" d="M148 226 L184 262 L254 190" pathLength={1} />
        {PARTICULAS.map((p, i) => (
          <circle key={i} className="com-particula" cx="200" cy="226" r={p.r} fill={p.cor} style={{ '--x': `${p.x}px`, '--y': `${p.y}px` } as CSSProperties} />
        ))}
        {/* lápis com a ponta na origem, inclinado como na mão de quem escreve */}
        <g className="com-lapis">
          <g transform="rotate(-40)">
            <path d="M0 0 L20 -7 L20 7 Z" fill="#E9C9A0" />
            <path d="M0 0 L7 -2.4 L7 2.4 Z" fill="#173527" />
            <rect x="20" y="-7" width="78" height="14" fill="#8BD15A" />
            <rect x="98" y="-7" width="8" height="14" fill="#C9D3C5" />
            <rect x="106" y="-7" width="14" height="14" rx="4" fill="#2F9E5B" />
          </g>
        </g>
      </svg>
      <p className="com-nome" aria-hidden="true">
        {'DONELY'.split('').map((l, i) => <span key={i} style={{ '--i': i } as CSSProperties}>{l}</span>)}
      </p>
    </div>
  );
}
