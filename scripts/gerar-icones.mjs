// ─────────────────────────────────────────────────────────────────────────────
// Gerador de ícones do Codex Arcanum — desenha o logótipo próprio pixel a pixel
// (pngjs, zero dependências nativas) e produz PNGs + favicon.ico.
// Design: círculo mágico violeta/ouro com o glifo </> — "código é magia".
//   npm run icones
// ─────────────────────────────────────────────────────────────────────────────
import { PNG } from 'pngjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destino = path.join(raiz, 'client', 'public');
fs.mkdirSync(destino, { recursive: true });

const L = 512; // tamanho mestre

// desenha no mestre; depois reduzimos por média de caixa
const mestre = new PNG({ width: L, height: L });

function misturar(px, i, r, g, b, a) {
  const a0 = px[i + 3] / 255;
  const a1 = a;
  const aF = a1 + a0 * (1 - a1);
  if (aF === 0) return;
  px[i] = (r * a1 + px[i] * a0 * (1 - a1)) / aF;
  px[i + 1] = (g * a1 + px[i + 1] * a0 * (1 - a1)) / aF;
  px[i + 2] = (b * a1 + px[i + 2] * a0 * (1 - a1)) / aF;
  px[i + 3] = aF * 255;
}

function suavizar(d) { return Math.max(0, Math.min(1, d + 0.5)); }

// fundo: quadrado arredondado com gradiente radial
function fundo() {
  const cx = L / 2, cy = L * 0.40, rMax = L * 0.78;
  const raio = L * 0.1875; // cantos arredondados (rx=96/512)
  for (let y = 0; y < L; y++) {
    for (let x = 0; x < L; x++) {
      const qx = Math.max(raio - x, 0, x - (L - raio));
      const qy = Math.max(raio - y, 0, y - (L - raio));
      const dentro = Math.hypot(qx, qy) < raio;
      if (!dentro) continue;
      const d = Math.min(1, Math.hypot(x - cx, y - cy) / rMax);
      // #3b2470 → #221646 → #0e0824
      const c = d < 0.55
        ? lerpC([59, 36, 112], [34, 22, 70], d / 0.55)
        : lerpC([34, 22, 70], [14, 8, 36], (d - 0.55) / 0.45);
      const i = (y * L + x) << 2;
      misturar(mestre.data, i, c[0], c[1], c[2], 1);
    }
  }
}
function lerpC(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

// anel: círculo de centro (cx,cy) raio r, espessura w, cor rgb, opacidade a
function anel(cx, cy, r, w, rgb, a) {
  for (let y = 0; y < L; y++) {
    for (let x = 0; x < L; x++) {
      const d = Math.abs(Math.hypot(x - cx, y - cy) - r) - w / 2;
      const al = a * suavizar(-d);
      if (al <= 0) continue;
      misturar(mestre.data, (y * L + x) << 2, rgb[0], rgb[1], rgb[2], al);
    }
  }
}

// segmento com pontas redondas (distância ponto-segmento)
function segmento(x1, y1, x2, y2, w, rgb, a) {
  const w2 = w / 2;
  const dx = x2 - x1, dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  for (let y = 0; y < L; y++) {
    for (let x = 0; x < L; x++) {
      let t = len2 ? ((x - x1) * dx + (y - y1) * dy) / len2 : 0;
      t = Math.max(0, Math.min(1, t));
      const px = x1 + dx * t, py = y1 + dy * t;
      const d = Math.hypot(x - px, y - py) - w2;
      const al = a * suavizar(-d);
      if (al <= 0) continue;
      misturar(mestre.data, (y * L + x) << 2, rgb[0], rgb[1], rgb[2], al);
    }
  }
}

function ponto(x, y, r, rgb, a) {
  for (let yy = Math.floor(y - r - 2); yy <= Math.ceil(y + r + 2); yy++) {
    for (let xx = Math.floor(x - r - 2); xx <= Math.ceil(x + r + 2); xx++) {
      if (xx < 0 || yy < 0 || xx >= L || yy >= L) continue;
      const d = Math.hypot(xx - x, yy - y) - r;
      const al = a * suavizar(-d);
      if (al <= 0) continue;
      misturar(mestre.data, (yy * L + xx) << 2, rgb[0], rgb[1], rgb[2], al);
    }
  }
}

function estrela(x, y, r, rgb, a) {
  segmento(x - r, y, x + r, y, r * 0.55, rgb, a);
  segmento(x, y - r, x, y + r, r * 0.55, rgb, a);
}

// ── composição ──
fundo();
const CX = L / 2, CY = L / 2;

anel(CX, CY, 196, 6, [199, 125, 255], 0.5);   // violeta exterior
anel(CX, CY, 170, 4, [255, 209, 102], 0.85);  // ouro
anel(CX, CY, 150, 2, [199, 125, 255], 0.35);  // violeta fino

// marcas rúnicas (pontos cardeais)
ponto(CX, 60, 7, [255, 209, 102], 1);
ponto(452, CY, 7, [199, 125, 255], 1);
ponto(CX, 452, 7, [255, 209, 102], 1);
ponto(60, CY, 7, [199, 125, 255], 1);

// glifo </> com halo (duas passagens: brilho + núcleo)
const OURO = [255, 243, 196];
const OURO2 = [255, 209, 102];
const glifo = [
  [150, 196, 92, 256], [92, 256, 150, 316],   // <
  [362, 196, 420, 256], [420, 256, 362, 316], // >
  [286, 160, 226, 352],                        // /
];
for (const [a, b, c, d] of glifo) segmento(a, b, c, d, 34, [199, 125, 255], 0.45); // halo
for (const [a, b, c, d] of glifo) segmento(a, b, c, d, 26, OURO, 0.95);
for (const [a, b, c, d] of glifo) segmento(a, b, c, d, 14, OURO2, 0.9); // núcleo

// faíscas
estrela(398, 108, 22, [255, 233, 168], 0.95);
estrela(118, 396, 15, [255, 233, 168], 0.75);

// ── redução por média de caixa ──
function reduzir(n) {
  const saida = new PNG({ width: n, height: n });
  const fator = L / n;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      let r = 0, g = 0, b = 0, a = 0, conta = 0;
      for (let yy = Math.floor(y * fator); yy < Math.floor((y + 1) * fator); yy++) {
        for (let xx = Math.floor(x * fator); xx < Math.floor((x + 1) * fator); xx++) {
          const i = (yy * L + xx) << 2;
          const al = mestre.data[i + 3] / 255;
          r += mestre.data[i] * al; g += mestre.data[i + 1] * al; b += mestre.data[i + 2] * al;
          a += al; conta++;
        }
      }
      const i = (y * n + x) << 2;
      if (a > 0) {
        saida.data[i] = Math.round(r / a);
        saida.data[i + 1] = Math.round(g / a);
        saida.data[i + 2] = Math.round(b / a);
      }
      saida.data[i + 3] = Math.round((a / conta) * 255);
    }
  }
  return saida;
}

// ── ICO com PNGs embutidos (16/32/48) ──
function ico(pngs) {
  const cabecalho = Buffer.alloc(6);
  cabecalho.writeUInt16LE(0, 0);
  cabecalho.writeUInt16LE(1, 2); // tipo ícone
  cabecalho.writeUInt16LE(pngs.length, 4);
  const entradas = [];
  let offset = 6 + 16 * pngs.length;
  for (const p of pngs) {
    const e = Buffer.alloc(16);
    e.writeUInt8(p.width >= 256 ? 0 : p.width, 0);
    e.writeUInt8(p.height >= 256 ? 0 : p.height, 1);
    e.writeUInt8(0, 2); e.writeUInt8(0, 3);
    e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6);
    e.writeUInt32LE(p.data.length, 8);
    e.writeUInt32LE(offset, 12);
    entradas.push(e);
    offset += p.data.length;
  }
  return Buffer.concat([cabecalho, ...entradas, ...pngs.map((p) => p.data)]);
}

// ── gerar tudo ──
const tamanhos = [512, 192, 180, 64, 48, 32, 16];
const pngs = {};
for (const t of tamanhos) {
  const p = reduzir(t);
  fs.writeFileSync(path.join(destino, t === 180 ? 'icon-180.png' : `icon-${t}.png`), PNG.sync.write(p));
  pngs[t] = p;
}
fs.writeFileSync(path.join(destino, 'favicon.ico'), ico([pngs[16], pngs[32], pngs[48]]));
console.log('✓ ícones gerados em client/public:', tamanhos.join(', '), '+ favicon.ico');
