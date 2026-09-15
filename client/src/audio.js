// Áudio sintetizado com WebAudio — zero ficheiros, zero dependências.
let ctxAudio = null;
let mudo = false;

function ac() {
  if (!ctxAudio) {
    try { ctxAudio = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; }
  }
  if (ctxAudio.state === 'suspended') ctxAudio.resume();
  return ctxAudio;
}

export function definirMudo(m) { mudo = m; }
export function estaMudo() { return mudo; }

function tom(freqIni, freqFim, dur, tipo = 'sine', vol = 0.16, quando = 0) {
  const c = ac();
  if (!c || mudo) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = tipo;
  const t0 = c.currentTime + quando;
  o.frequency.setValueAtTime(freqIni, t0);
  o.frequency.exponentialRampToValueAtTime(Math.max(20, freqFim), t0 + dur);
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(c.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

function ruido(dur, vol = 0.2, freqFiltro = 1000) {
  const c = ac();
  if (!c || mudo) return;
  const n = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, n, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const src = c.createBufferSource();
  src.buffer = buf;
  const filtro = c.createBiquadFilter();
  filtro.type = 'lowpass';
  filtro.frequency.value = freqFiltro;
  const g = c.createGain();
  g.gain.value = vol;
  src.connect(filtro).connect(g).connect(c.destination);
  src.start();
}

export function som(tipo) {
  switch (tipo) {
    case 'lancar': tom(520, 210, 0.13, 'sine', 0.1); break;
    case 'impacto': tom(190, 90, 0.09, 'square', 0.12); break;
    case 'dano': tom(240, 70, 0.16, 'sawtooth', 0.14); ruido(0.08, 0.1, 900); break;
    case 'parry': tom(1250, 900, 0.25, 'triangle', 0.18); tom(1870, 1500, 0.2, 'sine', 0.1, 0.02); break;
    case 'morte': ruido(0.5, 0.3, 500); tom(140, 40, 0.6, 'sawtooth', 0.2); break;
    case 'sinergia': tom(660, 660, 0.12, 'sine', 0.14); tom(990, 990, 0.16, 'sine', 0.14, 0.09); break;
    case 'erro': tom(150, 110, 0.16, 'square', 0.14); tom(150, 90, 0.18, 'square', 0.12, 0.17); break;
    case 'dash': ruido(0.14, 0.14, 2400); break;
    case 'escudo': tom(330, 520, 0.2, 'sine', 0.12); break;
    case 'quebra': tom(700, 160, 0.3, 'square', 0.16); ruido(0.2, 0.16, 1400); break;
    case 'ui': tom(700, 860, 0.06, 'sine', 0.08); break;
    case 'round': tom(880, 880, 0.35, 'triangle', 0.15); tom(1320, 1320, 0.3, 'sine', 0.08, 0.05); break;
    case 'vitoria': [523, 659, 784, 1047].forEach((f, i) => tom(f, f, 0.22, 'triangle', 0.15, i * 0.13)); break;
    case 'derrota': [392, 330, 262, 196].forEach((f, i) => tom(f, f * 0.94, 0.26, 'triangle', 0.14, i * 0.15)); break;
    case 'nivel': [660, 880, 1100, 1320].forEach((f, i) => tom(f, f, 0.16, 'sine', 0.14, i * 0.09)); break;
    default: break;
  }
}
