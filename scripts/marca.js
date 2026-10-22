// Gera a identidade visual do DONELY: SVG em brand/ e PNG em brand/png/.
// Uso: npm install && npm run marca
// O símbolo é uma prancheta com um check dentro da folha: a tarefa concluída do Donko.
// O nome é texto convertido em curvas a partir da Outfit (OFL), sem depender de fonte instalada.
const fs = require('fs');
const path = require('path');
const opentype = require('opentype.js');
const { Resvg } = require('@resvg/resvg-js');
const { woffToSfnt } = require('./woff2ttf.js');

const RAIZ = path.resolve(__dirname, '..');
const NOME = 'DONELY';

const CORES = {
  corpo: '#173527', folha: '#F5F8EE', clip: '#8BD15A', furo: '#173527', check: '#2F9E5B', texto: '#173527',
};
const MONO = { corpo: '#000000', folha: '#FFFFFF', clip: '#000000', furo: '#FFFFFF', check: '#000000', texto: '#000000' };
const BRANCO = { corpo: '#FFFFFF', folha: '#173527', clip: '#FFFFFF', furo: '#173527', check: '#FFFFFF', texto: '#FFFFFF' };

function carregaFonte() {
  const bin = fs.readFileSync(path.join(RAIZ, 'node_modules/@fontsource/outfit/files/outfit-latin-800-normal.woff'));
  const ttf = woffToSfnt(bin);
  return opentype.parse(ttf.buffer.slice(ttf.byteOffset, ttf.byteOffset + ttf.length));
}
const FONTE = carregaFonte();

// Nome com espaçamento entre letras: monta o caminho glifo a glifo.
function nomeCaminho(texto, tamanho, espaco) {
  const escala = tamanho / FONTE.unitsPerEm;
  const caminho = new opentype.Path();
  let x = 0;
  for (const g of FONTE.stringToGlyphs(texto)) {
    caminho.extend(g.getPath(x, 0, tamanho));
    x += g.advanceWidth * escala + espaco;
  }
  return caminho;
}

// Símbolo em coordenadas 400x400 (a prancheta ocupa x 80..320, y 36..360).
function simbolo(c) {
  return `
  <rect x="80" y="70" width="240" height="290" rx="34" fill="${c.corpo}"/>
  <rect x="104" y="112" width="192" height="226" rx="16" fill="${c.folha}"/>
  <rect x="150" y="36" width="100" height="62" rx="20" fill="${c.clip}"/>
  <rect x="176" y="56" width="48" height="16" rx="8" fill="${c.furo}"/>
  <path d="M148 226 L184 262 L254 190" fill="none" stroke="${c.check}" stroke-width="26" stroke-linecap="round" stroke-linejoin="round"/>`;
}

function textoCurvas(c, cx, cy, largura) {
  const caminho = nomeCaminho(NOME, 100, 3);
  const bb = caminho.getBoundingBox();
  const escala = largura / (bb.x2 - bb.x1);
  const ox = (bb.x1 + bb.x2) / 2, oy = (bb.y1 + bb.y2) / 2;
  return { altura: (bb.y2 - bb.y1) * escala, svg: `
  <path transform="translate(${cx} ${cy}) scale(${escala.toFixed(5)}) translate(${(-ox).toFixed(2)} ${(-oy).toFixed(2)})" d="${caminho.toPathData(2)}" fill="${c.texto}"/>` };
}

// Logo empilhado: símbolo em cima, nome embaixo, centralizado num canvas de 520 de largura.
function empilhado(c) {
  const W = 520, gap = 36, larguraNome = 440, P = 40;
  const texto = textoCurvas(c, W / 2, 0, larguraNome);
  const topo = 400 + gap;
  const t = textoCurvas(c, W / 2, topo + texto.altura / 2, larguraNome);
  const altura = topo + texto.altura;
  return { vb: `${-P} ${-P} ${W + 2 * P} ${Math.ceil(altura + 2 * P)}`, corpo: `<g transform="translate(60 0)">${simbolo(c)}</g>${t.svg}` };
}

// Logo horizontal: símbolo à esquerda, nome à direita, alinhado ao centro vertical do símbolo.
function horizontal(c) {
  const alturaNome = 170, espaco = 40;
  const caminho = nomeCaminho(NOME, 100, 3);
  const bb = caminho.getBoundingBox();
  const escala = alturaNome / (bb.y2 - bb.y1);
  const largura = (bb.x2 - bb.x1) * escala;
  const x0 = 400 + espaco;
  const cx = x0 + largura / 2, cy = 200;
  const ox = (bb.x1 + bb.x2) / 2, oy = (bb.y1 + bb.y2) / 2;
  const d = `<path transform="translate(${cx.toFixed(2)} ${cy}) scale(${escala.toFixed(5)}) translate(${(-ox).toFixed(2)} ${(-oy).toFixed(2)})" d="${caminho.toPathData(2)}" fill="${c.texto}"/>`;
  const P = 40, W = Math.ceil(x0 + largura);
  return { vb: `${-P} ${-P} ${W + 2 * P} ${400 + 2 * P}`, corpo: simbolo(c) + d };
}

// Folha de construção: grade de 40 unidades, eixo central e medidas-chave do símbolo.
function construcao() {
  const linhas = [];
  for (let x = 0; x <= 400; x += 40) linhas.push(`<line x1="${x}" y1="0" x2="${x}" y2="400" stroke="#173527" stroke-opacity="0.12" stroke-width="1"/>`);
  for (let y = 0; y <= 400; y += 40) linhas.push(`<line x1="0" y1="${y}" x2="400" y2="${y}" stroke="#173527" stroke-opacity="0.12" stroke-width="1"/>`);
  const guia = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#2F9E5B" stroke-width="1" stroke-dasharray="4 4"/>`;
  const rot = (x, y, t) => `<text x="${x}" y="${y}" font-family="Outfit, Arial, sans-serif" font-size="11" fill="#173527" fill-opacity="0.75">${t}</text>`;
  return { vb: '-60 -60 520 520', corpo: `
  <rect x="-60" y="-60" width="520" height="520" fill="#F5F8EE"/>
  ${linhas.join('')}
  <g opacity="0.35">${simbolo(CORES)}</g>
  ${simbolo(CORES)}
  ${guia(200, -20, 200, 380)}${guia(-20, 200, 420, 200)}
  ${guia(60, 70, 340, 70)}${guia(60, 360, 340, 360)}
  ${rot(330, 62, 'corpo 240 × 290')}${rot(-50, 124, 'clip 100 × 62')}
  ${rot(260, 20, 'eixo x = 200')}${rot(-50, 200, 'centro')}
  ${rot(-50, 375, 'check: 3 pontos, traço 26')}` };
}

const svg = (vb, corpo, titulo) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" role="img" aria-label="${titulo}">
  <title>${titulo}</title>${corpo}
</svg>
`;

const versoes = {
  'donely-principal': { t: 'DONELY', c: CORES, f: empilhado },
  'donely-horizontal': { t: 'DONELY', c: CORES, f: horizontal },
  'donely-monocromatico': { t: 'DONELY (monocromático)', c: MONO, f: empilhado },
  'donely-branco': { t: 'DONELY (branco, para fundo escuro)', c: BRANCO, f: empilhado },
  'donely-icone': { t: 'DONELY (ícone)', c: CORES, f: c => ({ vb: '26 0 380 380', corpo: simbolo(c) }) },
  'donely-construcao': { t: 'DONELY (construção do símbolo)', c: CORES, f: construcao },
  'donely-icone-monocromatico': { t: 'DONELY (ícone monocromático)', c: MONO, f: c => ({ vb: '26 0 380 380', corpo: simbolo(c) }) },
};

const dirSvg = path.join(RAIZ, 'brand'), dirPng = path.join(dirSvg, 'png');
fs.mkdirSync(dirPng, { recursive: true });
// Artes de apresentação (construção) ficam em plan/, junto com o restante do material de planejamento.
const dirPlano = path.join(RAIZ, 'plan/brand');
fs.mkdirSync(dirPlano, { recursive: true });
for (const [nome, v] of Object.entries(versoes)) {
  const r = v.f(v.c);
  const destino = nome === 'donely-construcao' ? dirPlano : dirSvg;
  fs.writeFileSync(path.join(destino, `${nome}.svg`), svg(r.vb, r.corpo, v.t));
}

const pngs = [
  ['donely-principal', 1024], ['donely-principal', 512], ['donely-horizontal', 1024],
  ['donely-monocromatico', 1024], ['donely-branco', 1024],
  ['donely-icone', 512], ['donely-icone', 192], ['donely-icone', 180], ['donely-icone', 64], ['donely-icone', 32], ['donely-icone', 16],
];
for (const [nome, tamanho] of pngs) {
  const img = new Resvg(fs.readFileSync(path.join(dirSvg, `${nome}.svg`)), { fitTo: { mode: 'width', value: tamanho } });
  fs.writeFileSync(path.join(dirPng, `${nome}-${tamanho}.png`), img.render().asPng());
}
console.log(`SVG: ${Object.keys(versoes).length} arquivos · PNG: ${pngs.length} arquivos em brand/png/`);
