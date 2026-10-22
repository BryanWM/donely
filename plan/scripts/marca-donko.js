// Gera a identidade visual do Donk Unity: SVG (brand/) e PNG (brand/png/).
// Uso: npm install && npm run marca
// As medidas vêm do logo original do Donko (424x391). O texto vira curva a partir da Fredoka One (OFL).
const fs = require('fs');
const path = require('path');
const opentype = require('opentype.js');
const { Resvg } = require('@resvg/resvg-js');
const { woffToSfnt } = require('./woff2ttf.js');

const RAIZ = path.resolve(__dirname, '..');
const NOME = 'Donko';
const CORES = {
  traco: '#000000', prancheta: '#E8D0A8', folhaA: '#EAF8D6', folhaB: '#BCC9A6',
  clipA: '#7AC13D', clipB: '#4EA33E', verde: '#4EA33E', contorno: '#FFFFFF',
  amarelo: '#FBD20A', laranja: '#F16723',
};
const MONO = { traco: '#000', prancheta: '#fff', folhaA: '#fff', folhaB: '#fff', clipA: '#fff', clipB: '#fff', verde: '#000', contorno: '#fff', amarelo: '#000', laranja: '#000' };

// Texto: caixa-alvo calibrada no logo original (x 56..394, y 172..243)
function textoVetor(c) {
  const bin = fs.readFileSync(path.join(RAIZ, 'node_modules/@fontsource/fredoka-one/files/fredoka-one-latin-400-normal.woff'));
  const ttf = woffToSfnt(bin);
  const font = opentype.parse(ttf.buffer.slice(ttf.byteOffset, ttf.byteOffset + ttf.length));
  const g = font.getPath(NOME, 0, 0, 100), bb = g.getBoundingBox();
  const L = 56, R = 394, T = 172, B = 243;
  const sx = (R - L) / (bb.x2 - bb.x1), sy = (B - T) / (bb.y2 - bb.y1);
  const cx = (L + R) / 2, cy = (T + B) / 2, gx = (bb.x1 + bb.x2) / 2, gy = (bb.y1 + bb.y2) / 2;
  const d = g.toPathData(2);
  return `
  <g transform="translate(${cx.toFixed(2)} ${cy.toFixed(2)}) scale(${sx.toFixed(4)} ${sy.toFixed(4)}) translate(${(-gx).toFixed(2)} ${(-gy).toFixed(2)})">
    <path d="${d}" fill="${c.contorno}" stroke="${c.contorno}" stroke-width="${(16 / sx).toFixed(2)}" stroke-linejoin="round" paint-order="stroke"/>
    <path d="${d}" fill="${c.verde}"/>
  </g>`;
}

function prancheta(c) {
  return `
  <defs>
    <linearGradient id="folha" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c.folhaA}"/><stop offset="1" stop-color="${c.folhaB}"/></linearGradient>
    <linearGradient id="clip" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.clipA}"/><stop offset="1" stop-color="${c.clipB}"/></linearGradient>
  </defs>
  <g stroke="${c.traco}" stroke-width="10" stroke-linejoin="round">
    <rect x="83" y="57" width="266" height="314" rx="24" fill="${c.prancheta}"/>
    <rect x="108" y="77" width="216" height="272" rx="12" fill="url(#folha)"/>
    <rect x="196" y="15" width="40" height="30" rx="10" fill="url(#clip)"/>
    <rect x="151" y="35" width="134" height="48" rx="14" fill="url(#clip)"/>
  </g>
  <rect x="93" y="84" width="5" height="256" rx="2.5" fill="${c.contorno}" opacity="0.9"/>
  <rect x="160" y="44" width="10" height="28" rx="5" fill="${c.contorno}" opacity="0.85"/>`;
}

function detalhes(c) {
  return `
  <circle cx="48" cy="67" r="6.5" fill="none" stroke="${c.amarelo}" stroke-width="5"/>
  <path d="M163 20H181M172 11V29" stroke="${c.amarelo}" stroke-width="6" stroke-linecap="round"/>
  <path d="M44 318H60M52 310V326" stroke="${c.laranja}" stroke-width="6" stroke-linecap="round"/>
  <circle cx="374" cy="278" r="6.5" fill="none" stroke="${c.laranja}" stroke-width="5"/>
  <g fill="${c.traco}">
    <circle cx="98" cy="34" r="2.8"/><circle cx="327" cy="36" r="2.8"/><circle cx="352" cy="19" r="2.8"/>
    <circle cx="29" cy="221" r="2.8"/><circle cx="383" cy="168" r="2.8"/><circle cx="322" cy="317" r="2.8"/>
    <circle cx="369" cy="357" r="2.8"/>
  </g>`;
}

const svg = (vb, corpo, titulo) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" role="img" aria-label="${titulo}">
  <title>${titulo}</title>${corpo}
</svg>
`;

const versoes = {
  'logo-completo': { vb: '0 0 424 391', corpo: c => prancheta(c) + detalhes(c) + textoVetor(c), titulo: 'Donk Unity', cores: CORES },
  'logo-monocromatico': { vb: '0 0 424 391', corpo: c => prancheta(c) + detalhes(c) + textoVetor(c), titulo: 'Donk Unity (monocromático)', cores: MONO },
  'icone': { vb: '26 0 380 380', corpo: c => prancheta(c), titulo: 'Donk Unity (ícone)', cores: CORES },
};

const dirSvg = path.join(RAIZ, 'brand'), dirPng = path.join(dirSvg, 'png');
fs.mkdirSync(dirPng, { recursive: true });
const pngs = [
  ['logo-completo', 1024], ['logo-completo', 512], ['logo-monocromatico', 1024],
  ['icone', 512], ['icone', 192], ['icone', 180], ['icone', 64], ['icone', 32], ['icone', 16],
];
for (const [nome, v] of Object.entries(versoes)) {
  const texto = svg(v.vb, v.corpo(v.cores), v.titulo);
  fs.writeFileSync(path.join(dirSvg, `${nome}.svg`), texto);
}
for (const [nome, tamanho] of pngs) {
  const img = new Resvg(fs.readFileSync(path.join(dirSvg, `${nome}.svg`)), { fitTo: { mode: 'width', value: tamanho } });
  fs.writeFileSync(path.join(dirPng, `${nome}-${tamanho}.png`), img.render().asPng());
}
console.log(`SVG: ${Object.keys(versoes).length} arquivos · PNG: ${pngs.length} arquivos em brand/png/`);
