// Ícones de traço (24x24), no estilo lucide. Decorativos: aria-hidden.
const PATHS = {
  mais: 'M12 5v14M5 12h14',
  x: 'M18 6 6 18M6 6l12 12',
  check: 'M20 6 9 17l-5-5',
  busca: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
  mais_opcoes: 'M12 5h.01M12 12h.01M12 19h.01',
  arquivo: 'M2 3h20v5H2zM4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8M10 12h4',
  desfazer: 'M3 7v6h6M21 17a9 9 0 0 0-15-6.7L3 13',
  lixeira: 'M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6',
  externo: 'M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6',
  livro: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z',
  lista: 'm3 17 2 2 4-4M3 7l2 2 4-4M13 6h8M13 12h8M13 18h8',
  quadro: 'M3 3h18v18H3zM8 7v7M12 7v4M16 7v9',
  relogio: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  ajustes: 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6',
  alerta: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 8v4M12 16h.01',
  raio: 'M13 2 4 14h7l-1 8 9-12h-7z',
  baixar: 'M12 3v12M7 10l5 5 5-5M5 21h14',
  sincronizar: 'M21 12a9 9 0 0 1-15.5 6.2L3 16M3 12a9 9 0 0 1 15.5-6.2L21 8M21 3v5h-5M3 21v-5h5',
  clipe: 'm21.4 11.1-9.2 9.2a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5',
  play: 'M7 4.5v15l12-7.5z',
  pausa: 'M9 5v14M15 5v14',
  anterior: 'm15 18-6-6 6-6',
  proximo: 'm9 18 6-6-6-6',
  desligar: 'M12 2v10M18.4 6.6a9 9 0 1 1-12.8 0',
} as const;

export type NomeIcone = keyof typeof PATHS;

export function Icone({ nome, tamanho = 16 }: { nome: NomeIcone; tamanho?: number }) {
  return (
    <svg className="icone" width={tamanho} height={tamanho} viewBox="0 0 24 24" aria-hidden="true"
      fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d={PATHS[nome]} />
    </svg>
  );
}
