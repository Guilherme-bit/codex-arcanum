// ─────────────────────────────────────────────────────────────────────────────
// Servidor autoritativo do Codex Arcanum.
// O código dos feitiços é recebido no início do duelo, validado e executado
// APENAS aqui. Os clientes enviam intenções de input e recebem snapshots a 20 Hz.
// ─────────────────────────────────────────────────────────────────────────────
import express from 'express';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Server } from 'socket.io';
import {
  Partida, inputVazio, compilarFeitico, obterClassicos,
  FOTO_TICKS, ENERGIA_ARCANA_MAX, ligaDe, MAPAS, SKINS,
} from '@codex/shared';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(__dirname, '..', '..');
const PORTA = process.env.PORT || 3000;

// ── Elo persistente (ficheiro JSON; em plataformas sem disco é efémero) ──────
const FICHEIRO_ELO = path.join(__dirname, 'data', 'elo.json');
let elos = {};
try { elos = JSON.parse(fs.readFileSync(FICHEIRO_ELO, 'utf8')); } catch { /* primeira vez */ }
let gravacaoAgendada = false;
function gravarElos() {
  if (gravacaoAgendada) return;
  gravacaoAgendada = true;
  setTimeout(() => {
    gravacaoAgendada = false;
    try {
      fs.mkdirSync(path.dirname(FICHEIRO_ELO), { recursive: true });
      fs.writeFileSync(FICHEIRO_ELO, JSON.stringify(elos, null, 1));
    } catch { /* sistema de ficheiros só de leitura — ignora */ }
  }, 1500);
}
const eloDe = (nome) => (elos[nome] ??= { rating: 1000, v: 0, d: 0 });

function atualizarElo(nomeA, nomeB, venceuA) {
  const a = eloDe(nomeA), b = eloDe(nomeB);
  const esperadoA = 1 / (1 + 10 ** ((b.rating - a.rating) / 400));
  const deltaA = Math.round(32 * ((venceuA ? 1 : 0) - esperadoA));
  a.rating += deltaA; b.rating -= deltaA;
  if (venceuA) { a.v++; b.d++; } else { a.d++; b.v++; }
  gravarElos();
  return { deltaA, deltaB: -deltaA, ratingA: a.rating, ratingB: b.rating };
}

// ── HTTP: serve o cliente compilado (deployment de serviço único) ────────────
const app = express();
app.get('/api/saude', (_req, res) => res.json({ ok: true, online: io?.engine?.clientsCount ?? 0 }));
const distCliente = path.join(raiz, 'client', 'dist');
app.use(express.static(distCliente, { index: false, maxAge: '7d' })); // assets com hash: cache longa
app.get(/^\/(?!api|socket\.io).*/, (_req, res) => {
  res.set('Cache-Control', 'no-store'); // index.html sempre fresco (aponta assets com hash)
  res.sendFile(path.join(distCliente, 'index.html'));
});

const servidorHttp = http.createServer(app);
const io = new Server(servidorHttp, { cors: { origin: '*' }, pingTimeout: 20000 });

// ── Estado do servidor ───────────────────────────────────────────────────────
const sessoes = new Map();     // socketId → { nome, socket }
const filas = { casual: [], ranqueado: [] };
const partidas = new Map();    // partidaId → { id, modo, partida, sessoes:[a,b], intervalo }
let proximaPartida = 1;

const classicos = obterClassicos();

// Valida o loadout enviado pelo cliente; devolve { ok, loadoutCompilado, erro }.
// Cada slot pode ser uma string de código ou { codigo, potencia } (Tinta de Treino).
function validarLoadout(codigos) {
  const compilados = [];
  for (let i = 0; i < 6; i++) {
    const item = codigos?.[i];
    const codigo = typeof item === 'string' ? item : item?.codigo;
    const potencia = (typeof item === 'object' && item && Number.isFinite(Number(item.potencia)))
      ? Math.min(1, Math.max(0.5, Number(item.potencia)))
      : 1;
    if (!codigo || typeof codigo !== 'string') { compilados.push(null); continue; }
    const r = compilarFeitico(codigo);
    if (!r.ok) return { ok: false, erro: `Feitiço no slot ${i + 1} inválido: ${r.erros[0]}` };
    r.feitico.potencia = potencia;
    compilados.push(r.feitico);
  }
  if (!compilados.some(Boolean)) compilados.forEach((_, i) => { compilados[i] = classicos[i]; });
  for (let i = 0; i < 6; i++) if (!compilados[i]) compilados[i] = null;
  const energia = compilados.filter(Boolean).reduce((s, f) => s + f.complexidade, 0);
  if (energia > ENERGIA_ARCANA_MAX) {
    return { ok: false, erro: `Energia arcana do loadout (${energia}) excede o orçamento (${ENERGIA_ARCANA_MAX}).` };
  }
  return { ok: true, loadout: compilados, energia };
}

// ── Criação e ciclo de vida das partidas ─────────────────────────────────────
function criarPartida(sockA, sockB, modo) {
  const id = 'p' + proximaPartida++;
  console.log(`[partida] ${id} (${modo}): ${sessoes.get(sockA.id)?.nome} (${sockA.id}) vs ${sessoes.get(sockB.id)?.nome} (${sockB.id})`);
  const loadA = sessoes.get(sockA.id).loadout;
  const loadB = sessoes.get(sockB.id).loadout;
  const partida = new Partida({
    semente: (Date.now() ^ (proximaPartida * 7919)) >>> 0,
    mapaId: MAPAS[Math.floor(partidaAleatoria() * MAPAS.length)].id,
    jogadores: [
      { id: sockA.id, nome: sessoes.get(sockA.id).nome, skin: sessoes.get(sockA.id).skin, loadout: loadA },
      { id: sockB.id, nome: sessoes.get(sockB.id).nome, skin: sessoes.get(sockB.id).skin, loadout: loadB },
    ],
  });
  const p = { id, modo, partida, sockets: [sockA, sockB], ticksFoto: 0, terminada: false };
  partidas.set(id, p);
  sockA.join(id); sockB.join(id);
  sockA.emit('dueloEncontrado', infoDuelo(p, sockA.id));
  sockB.emit('dueloEncontrado', infoDuelo(p, sockB.id));

  p.intervalo = setInterval(() => {
    partida.passo();
    if (++p.ticksFoto >= FOTO_TICKS) {
      p.ticksFoto = 0;
      io.to(id).emit('estado', partida.snapshot());
    }
    if (partida.resultadoFinal && !p.terminada) terminarPartida(p);
  }, 1000 / 60);
  return p;
}

function infoDuelo(p, meuId) {
  const [a, b] = p.sockets;
  const outro = a.id === meuId ? b : a;
  const eu = a.id === meuId ? a : b;
  const ratingAdversario = eloDe(sessoes.get(outro.id).nome).rating;
  return {
    partidaId: p.id, modo: p.modo, meuId,
    adversario: {
      nome: sessoes.get(outro.id).nome,
      rating: p.modo === 'ranqueado' ? ratingAdversario : undefined,
    },
    meuRating: p.modo === 'ranqueado' ? eloDe(sessoes.get(eu.id).nome).rating : undefined,
  };
}

function terminarPartida(p) {
  p.terminada = true;
  clearInterval(p.intervalo);
  console.log(`[fim] ${p.id}: vencedor=${p.partida.resultadoFinal?.vencedor} desistencia=${!!p.partida.resultadoFinal?.desistencia} placar=${p.partida.placar.join('-')}`);
  const res = p.partida.resultadoFinal;
  const [sa, sb] = p.sockets;
  const nomeA = sessoes.get(sa.id)?.nome, nomeB = sessoes.get(sb.id)?.nome;
  let elo = null;
  if (p.modo === 'ranqueado' && nomeA && nomeB) {
    const deltas = atualizarElo(nomeA, nomeB, res.vencedor === sa.id);
    elo = { a: deltas, b: { ...deltas, deltaA: deltas.deltaB, deltaB: deltas.deltaA, ratingA: deltas.ratingB, ratingB: deltas.ratingA } };
  }
  const fimPara = (sock, i) => {
    const meuNome = sessoes.get(sock.id)?.nome;
    const meu = meuNome ? eloDe(meuNome) : null;
    sock.emit('fimDuelo', {
      vencedor: res.vencedor,
      placar: res.placar,
      venci: res.vencedor === sock.id,
      desistencia: !!res.desistencia,
      modo: p.modo,
      deltaElo: p.modo === 'ranqueado' && elo ? (i === 0 ? elo.a.deltaA : elo.b.deltaA) : 0,
      rating: p.modo === 'ranqueado' && meu ? meu.rating : undefined,
      liga: p.modo === 'ranqueado' && meu ? ligaDe(meu.rating) : undefined,
    });
  };
  if (sa.connected) fimPara(sa, 0);
  if (sb.connected) fimPara(sb, 1);
  io.to(p.id).emit('estado', p.partida.snapshot());
  setTimeout(() => partidas.delete(p.id), 15000);
}

// ── Matchmaking ──────────────────────────────────────────────────────────────
setInterval(() => {
  if (partidas.size > 40) return; // proteção do plano gratuito
  for (const modo of ['casual', 'ranqueado']) {
    const fila = filas[modo].filter((sid) => sessoes.has(sid) && io.of('/').sockets.get(sid)?.connected);
    filas[modo] = fila;
    if (fila.length >= 2) {
      let ia = 0, ib = 1;
      if (modo === 'ranqueado') {
        // pareia os dois ratings mais próximos
        let melhorDif = Infinity;
        for (let i = 0; i < fila.length; i++) {
          for (let j = i + 1; j < fila.length; j++) {
            const dif = Math.abs(eloDe(sessoes.get(fila[i]).nome).rating - eloDe(sessoes.get(fila[j]).nome).rating);
            if (dif < melhorDif) { melhorDif = dif; ia = i; ib = j; }
          }
        }
      }
      const [a, b] = [fila[ia], fila[ib]].map((sid) => io.of('/').sockets.get(sid));
      filas[modo] = fila.filter((sid) => sid !== a.id && sid !== b.id);
      if (a && b) criarPartida(a, b, modo);
    }
  }
}, 500);

// ── Ligação de clientes ──────────────────────────────────────────────────────
io.on('connection', (sock) => {
  sock.on('entrar', ({ nome, skin } = {}) => {
    const limpo = String(nome ?? '').trim().slice(0, 18) || 'Mago Anónimo';
    sessoes.set(sock.id, {
      nome: limpo, loadout: null,
      skin: SKINS.some((s) => s.id === skin) ? skin : 'aprendiz',
    });
    const e = eloDe(limpo);
    sock.emit('entrado', { nome: limpo, rating: e.rating, liga: ligaDe(e.rating), online: io.engine.clientsCount });
  });

  sock.on('definirLoadout', ({ loadout } = {}) => {
    const s = sessoes.get(sock.id);
    if (!s) return;
    const v = validarLoadout(loadout);
    if (!v.ok) { sock.emit('erroLoadout', v.erro); return; }
    s.loadout = v.loadout;
    sock.emit('loadoutOk', { energia: v.energia });
  });

  sock.on('procurarDuelo', ({ modo, loadout } = {}) => {
    const s = sessoes.get(sock.id);
    if (!s) return;
    if (!partidas.has([...sock.rooms][1])) {
      const v = validarLoadout(loadout);
      if (!v.ok) { sock.emit('erroLoadout', v.erro); return; }
      s.loadout = v.loadout;
      const f = filas[modo === 'ranqueado' ? 'ranqueado' : 'casual'];
      if (!f.includes(sock.id)) f.push(sock.id);
      sock.emit('emFila', { modo, posicao: f.length });
    }
  });

  sock.on('cancelarProcura', () => {
    filas.casual = filas.casual.filter((s) => s !== sock.id);
    filas.ranqueado = filas.ranqueado.filter((s) => s !== sock.id);
  });

  // Intenções de input do duelo online (aplicadas no próximo tick)
  sock.on('input', (entrada) => {
    for (const p of partidas.values()) {
      if (p.terminada) continue;
      if ([...sock.rooms].includes(p.id)) {
        p.partida.definirInput(sock.id, entrada ?? inputVazio());
        break;
      }
    }
  });

  // 'disconnecting' ainda tem as salas — é aqui que se decide a desistência
  sock.on('disconnecting', () => {
    for (const p of partidas.values()) {
      if (p.terminada || !sock.rooms.has(p.id)) continue;
      const outro = p.sockets.find((s) => s.id !== sock.id);
      if (outro && outro.connected) {
        p.partida.fase = 'fimPartida';
        p.partida.resultadoFinal = { vencedor: outro.id, placar: p.partida.placar.slice(), desistencia: true };
        terminarPartida(p);
      } else {
        p.terminada = true; clearInterval(p.intervalo);
      }
    }
  });

  sock.on('disconnect', (motivo) => {
    console.log(`[desligou] ${sock.id} (${sessoes.get(sock.id)?.nome ?? '?'}) motivo=${motivo}`);
    filas.casual = filas.casual.filter((s) => s !== sock.id);
    filas.ranqueado = filas.ranqueado.filter((s) => s !== sock.id);
    sessoes.delete(sock.id);
  });
});

servidorHttp.listen(PORTA, () => {
  console.log(`⚔ Codex Arcanum — servidor a ouvir na porta ${PORTA}`);
});

// pequena utilidade local (Math.random é seguro aqui: não é lógica de simulação)
function partidaAleatoria() {
  return Math.random();
}
