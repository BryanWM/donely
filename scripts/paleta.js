// Gera as escalas de cor do DONELY (5 tons por cor) em OKLCH: tokens CSS/JSON e uma folha visual.
// Uso: npm run paleta
const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const RAIZ = path.resolve(__dirname, '..');
const BASES = [
  { id: 'tinta', nome: 'Verde-tinta', hex: '#173527', papel: 'Prancheta, nome, texto' },
  { id: 'check', nome: 'Verde do check', hex: '#2F9E5B', papel: 'Check, sucesso, ação principal' },
  { id: 'lima', nome: 'Lima', hex: '#8BD15A', papel: 'Clip, destaque' },
  { id: 'papel', nome: 'Papel', hex: '#F5F8EE', papel: 'Fundo, superfícies, neutros' },
];
const NOMES = [100, 300, 500, 700, 900];
const TOPO = 0.965, FUNDO = 0.30; // luminosidade OKLCH do tom mais claro e do mais escuro

// --- conversões sRGB <-> OKLab/OKLCH ---
const lin = c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const gam = c => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => v / 255); }
function rgbHex(rgb) { return '#' + rgb.map(v => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0')).join('').toUpperCase(); }
function toOklch(hex) {
  const [r, g, b] = hexRgb(hex).map(lin);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;
  return { L, C: Math.hypot(A, B), H: Math.atan2(B, A) };
}
function fromOklch(L, C, H) {
  const A = C * Math.cos(H), B = C * Math.sin(H);
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.2914855480 * B) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ];
}
const dentro = rgb => rgb.every(v => v >= -1e-4 && v <= 1 + 1e-4);
// reduz o croma até a cor caber no sRGB (mantém luminosidade e matiz)
function noGamut(L, C, H) {
  if (dentro(fromOklch(L, C, H))) return fromOklch(L, C, H);
  let lo = 0, hi = C;
  for (let i = 0; i < 30; i++) { const mid = (lo + hi) / 2; if (dentro(fromOklch(L, mid, H))) lo = mid; else hi = mid; }
  return fromOklch(L, lo, H);
}
const luminancia = hex => { const [r, g, b] = hexRgb(hex).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contraste = (a, b) => { const x = luminancia(a), y = luminancia(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

// --- escalas ---
// A cor da marca ocupa a posição que deixa os saltos de luminosidade mais uniformes.
// Acima dela os tons sobem até TOPO, abaixo descem até FUNDO, sempre em passos iguais.
function luminosidades(Lb, idx) {
  const out = [];
  for (let i = 0; i < 5; i++) {
    if (i < idx) out.push(TOPO + (Lb - TOPO) * (i / idx));
    else if (i === idx) out.push(Lb);
    else out.push(Lb + (FUNDO - Lb) * ((i - idx) / (4 - idx)));
  }
  return out;
}
const escalas = BASES.map(base => {
  const o = toOklch(base.hex);
  let melhor = null;
  for (let idx = 0; idx < 5; idx++) {
    const Ls = luminosidades(o.L, idx);
    const saltos = Ls.slice(1).map((v, i) => Ls[i] - v);
    if (saltos.some(d => d <= 0)) continue;
    const ideal = (TOPO - FUNDO) / 4; // salto de uma escala completa e uniforme
    const nota = saltos.reduce((soma, d) => soma + Math.abs(d - ideal), 0);
    if (!melhor || nota < melhor.nota) melhor = { idx, Ls, nota };
  }
  const tons = melhor.Ls.map((L, i) => {
    const ehBase = i === melhor.idx;
    // croma máximo na cor da marca; diminui em direção aos extremos (mais nos claros)
    const t = i < melhor.idx ? (melhor.idx - i) / melhor.idx : i > melhor.idx ? (i - melhor.idx) / (4 - melhor.idx) : 0;
    const k = i < melhor.idx ? 1 - 0.7 * t : 1 - 0.35 * t;
    const hex = ehBase ? base.hex : rgbHex(noGamut(L, o.C * k, o.H).map(gam));
    return { n: NOMES[i], hex, base: ehBase, cBranco: contraste(hex, '#FFFFFF'), cTinta: contraste(hex, '#173527') };
  });
  return { ...base, oklch: o, passoBase: NOMES[melhor.idx], tons };
});

// --- tokens ---
const css = [
  '/* Paleta DONELY: 5 tons por cor (gerado por scripts/paleta.js, não edite à mão) */',
  ':root {',
  ...escalas.flatMap(e => [`  /* ${e.nome}: base no tom ${e.passoBase} */`, ...e.tons.map(t => `  --${e.id}-${t.n}: ${t.hex};`)]),
  '',
  '  /* Papéis de uso */',
  '  --cor-fundo: var(--papel-100);',
  '  --cor-superficie: #FFFFFF;',
  '  --cor-borda: var(--papel-300);',
  '  --cor-texto: var(--tinta-900);',
  '  --cor-texto-apagado: var(--papel-700);',
  '  --cor-acao: var(--check-700);',
  '  --cor-sucesso: var(--check-500);',
  '  --cor-destaque: var(--lima-300);',
  '}',
  '',
].join('\n');
fs.writeFileSync(path.join(RAIZ, 'brand/tokens/cores.css'), css);
fs.writeFileSync(path.join(RAIZ, 'brand/tokens/cores.json'), JSON.stringify(Object.fromEntries(escalas.map(e => [e.id, Object.fromEntries(e.tons.map(t => [t.n, t.hex]))])), null, 2) + '\n');

// --- folha visual ---
const W = 1030, linha = 150, topo = 110, esq = 210, larg = 148, gap = 8;
const fonte = 'Outfit, Arial, sans-serif';
let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${topo + escalas.length * linha + 50}" role="img" aria-label="Paleta DONELY">
  <title>Paleta DONELY</title>
  <rect width="100%" height="100%" fill="#FFFFFF"/>
  <text x="40" y="54" font-family="${fonte}" font-weight="800" font-size="26" fill="#173527" letter-spacing="1">DONELY · Paleta</text>
  <text x="40" y="80" font-family="${fonte}" font-size="13" fill="#4E5A50">5 tons por cor, calculados em OKLCH. O anel marca a cor original da marca. "Aa" mostra o texto que passa no contraste AA.</text>`;
escalas.forEach((e, i) => {
  const y = topo + i * linha;
  svg += `
  <text x="40" y="${y + 40}" font-family="${fonte}" font-weight="700" font-size="16" fill="#173527">${e.nome}</text>
  <text x="40" y="${y + 60}" font-family="${fonte}" font-size="12" fill="#4E5A50">${e.papel}</text>
  <text x="40" y="${y + 78}" font-family="${fonte}" font-size="11" fill="#6B776D">--${e.id}-*</text>`;
  e.tons.forEach((t, j) => {
    const x = esq + j * (larg + gap);
    const textoCor = t.cBranco >= 4.5 ? '#FFFFFF' : '#173527';
    const passa = Math.max(t.cBranco, t.cTinta) >= 4.5;
    svg += `
  <rect x="${x}" y="${y}" width="${larg}" height="96" rx="12" fill="${t.hex}" ${t.n === 100 ? 'stroke="#DCE3D6" stroke-width="1"' : ''}/>
  ${t.base ? `<rect x="${x - 4}" y="${y - 4}" width="${larg + 8}" height="104" rx="15" fill="none" stroke="#173527" stroke-width="2"/>` : ''}
  <text x="${x + 14}" y="${y + 30}" font-family="${fonte}" font-weight="700" font-size="20" fill="${textoCor}">${passa ? 'Aa' : ''}</text>
  <text x="${x + 14}" y="${y + 84}" font-family="${fonte}" font-size="12" fill="${textoCor}">${t.n}${t.base ? ' · base' : ''}</text>
  <text x="${x}" y="${y + 116}" font-family="${fonte}" font-weight="700" font-size="13" fill="#173527">${t.hex}</text>
  <text x="${x}" y="${y + 133}" font-family="${fonte}" font-size="11" fill="#6B776D">branco ${t.cBranco.toFixed(1)} · tinta ${t.cTinta.toFixed(1)}</text>`;
  });
});
svg += '\n</svg>\n';
fs.writeFileSync(path.join(RAIZ, 'brand/donely-paleta.svg'), svg);
fs.writeFileSync(path.join(RAIZ, 'brand/png/donely-paleta.png'), new Resvg(svg, { fitTo: { mode: 'width', value: 1960 }, font: { loadSystemFonts: true } }).render().asPng());

for (const e of escalas) console.log(e.nome.padEnd(15), e.tons.map(t => `${t.n}:${t.hex}${t.base ? '*' : ''}`).join('  '));
