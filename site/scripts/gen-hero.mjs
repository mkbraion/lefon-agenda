/**
 * Gera as texturas do hero: o skyline e o mapa de profundidade correspondente.
 *
 * Roda no `prebuild`, então as imagens nascem junto com o build (inclusive na
 * Vercel) em vez de viajarem como binário. PNG escrito na mão com zlib — sem
 * dependência de imagem no projeto.
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const W = 600;
const H = 600;

/* PRNG determinístico — o skyline precisa ser o mesmo em todo build. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(1042);
const randInt = (min, max) => min + Math.floor(rnd() * (max - min + 1));
const randRange = (min, max) => min + rnd() * (max - min);

function crc32(buf) {
  let c;
  const table = crc32.table || (crc32.table = (() => {
    const t = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c;
    }
    return t;
  })());
  c = -1;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(tag, data) {
  const body = Buffer.concat([Buffer.from(tag, 'latin1'), data]);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function writePng(path, w, h, rows) {
  const raw = Buffer.concat(rows.map((r) => Buffer.concat([Buffer.from([0]), r])));
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bits por canal
  ihdr[9] = 2; // RGB
  writeFileSync(
    path,
    Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk('IHDR', ihdr),
      chunk('IDAT', deflateSync(raw, { level: 9 })),
      chunk('IEND', Buffer.alloc(0)),
    ])
  );
}

const color = Array.from({ length: H }, () => new Array(W).fill(null));
const depth = Array.from({ length: H }, () => new Float32Array(W));

/* --- céu: gradiente quente escuro com brilho difuso à direita --- */
for (let y = 0; y < H; y++) {
  const t = y / (H - 1);
  const r = 16 + 26 * t * t;
  const g = 13 + 19 * t * t;
  const b = 11 + 14 * t * t;
  for (let x = 0; x < W; x++) {
    const dx = (x - W * 0.72) / W;
    const dy = (y - H * 0.3) / H;
    const glow = Math.max(0, 1 - Math.hypot(dx, dy) * 2.6) ** 2;
    color[y][x] = [
      Math.min(255, Math.round(r + glow * 46)),
      Math.min(255, Math.round(g + glow * 24)),
      Math.min(255, Math.round(b + glow * 16)),
    ];
    depth[y][x] = 0.04;
  }
}

/* --- prédios, do fundo para a frente (profundidade cresce) --- */
const LAYERS = [
  { baseF: 0.74, hMin: 0.16, hMax: 0.34, col: [32, 26, 22], dep: 0.28, wDens: 0.3 },
  { baseF: 0.84, hMin: 0.24, hMax: 0.46, col: [44, 34, 29], dep: 0.58, wDens: 0.42 },
  { baseF: 1.0, hMin: 0.3, hMax: 0.58, col: [58, 43, 36], dep: 0.9, wDens: 0.52 },
];
const WINDOW_COLORS = [
  [214, 168, 108],
  [233, 214, 176],
  [196, 92, 74],
  [168, 140, 96],
];

for (const { baseF, hMin, hMax, col, dep, wDens } of LAYERS) {
  const baseY = Math.round(H * baseF);
  let x = -randInt(0, 40);
  while (x < W) {
    const bw = randInt(Math.round(W * 0.055), Math.round(W * 0.115));
    const bh = Math.round(H * randRange(hMin, hMax));
    const top = Math.max(0, baseY - bh);
    const v = randInt(-6, 8);
    const c = col.map((n) => Math.max(0, Math.min(255, n + v)));

    for (let yy = top; yy < Math.min(H, baseY); yy++) {
      for (let xx = Math.max(0, x); xx < Math.min(W, x + bw); xx++) {
        color[yy][xx] = c;
        depth[yy][xx] = dep;
      }
      // aresta iluminada à esquerda, para dar volume
      if (x >= 0 && x < W) color[yy][x] = c.map((n) => Math.min(255, n + 14));
    }

    // janelas
    const pad = 4;
    for (let wx = x + pad; wx + 4 < x + bw - pad; wx += 9) {
      for (let wy = top + 7; wy + 6 < baseY - 5; wy += 12) {
        if (rnd() >= wDens) continue;
        const f = 0.45 + dep * 0.55;
        const wc = WINDOW_COLORS[randInt(0, WINDOW_COLORS.length - 1)].map((n) =>
          Math.round(n * f)
        );
        for (let yy = wy; yy < Math.min(H, wy + 5); yy++) {
          for (let xx = Math.max(0, wx); xx < Math.min(W, wx + 3); xx++) {
            color[yy][xx] = wc;
          }
        }
      }
    }
    x += bw + randInt(2, 9);
  }
}

/* --- rua em primeiro plano --- */
for (let y = Math.round(H * 0.965); y < H; y++) {
  for (let x = 0; x < W; x++) {
    color[y][x] = [24, 19, 16];
    depth[y][x] = 1;
  }
}

mkdirSync(OUT_DIR, { recursive: true });

writePng(
  resolve(OUT_DIR, 'hero-skyline.png'),
  W,
  H,
  color.map((row) => Buffer.from(row.flat()))
);

writePng(
  resolve(OUT_DIR, 'hero-depth.png'),
  W,
  H,
  depth.map((row) => {
    const out = Buffer.alloc(W * 3);
    for (let x = 0; x < W; x++) {
      const v = Math.round(Math.max(0, Math.min(1, row[x])) * 255);
      out[x * 3] = v;
      out[x * 3 + 1] = v;
      out[x * 3 + 2] = v;
    }
    return out;
  })
);

console.log(`hero textures geradas em ${OUT_DIR} (${W}x${H})`);
