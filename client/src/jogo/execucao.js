// Sessões de jogo: cria o palco (canvas + HUD), corre o loop e trata do fim.
// Local: simulação corre no browser a 60 Hz. Online: snapshots do servidor a 20 Hz
// com interpolação (~110 ms de atraso de render).
import { Partida, inputDoBot, obterClassicos, DT } from '@codex/shared';
import { Renderizador } from '../render/renderizador.js';
import { Controlos } from './controles.js';
import { criarHud } from '../ui/hud.js';
import { som } from '../audio.js';

const SOM_EVENTO = {
  lancou: 'lancar', impacto: 'impacto', dano: 'dano', parry: 'parry', morte: 'morte',
  sinergia: 'sinergia', erro: 'erro', dash: 'dash', teleporte: 'dash', escudo: 'escudo',
  quebra: 'quebra', round: 'round', sobremorte: 'round',
};

function criarPalco() {
  const palco = document.createElement('div');
  palco.className = 'palco';
  const canvas = document.createElement('canvas');
  palco.appendChild(canvas);
  document.body.appendChild(palco);
  return { palco, canvas };
}

function sobreposicaoFim(palco, { venceu, titulo, sub, onRepetir, onSair, comRepetir = true }) {
  const el = document.createElement('div');
  el.className = 'sobreposicao';
  el.innerHTML = `
    <div class="caixa-fim">
      <h2 class="${venceu ? 'vitoria' : 'derrota'}">${titulo}</h2>
      <p>${sub}</p>
      <div style="display:flex; gap:10px; justify-content:center;">
        ${comRepetir ? '<button class="primario" data-repetir>Duelar outra vez</button>' : ''}
        <button data-sair>Sair da arena</button>
      </div>
    </div>`;
  palco.appendChild(el);
  el.querySelector('[data-sair]').onclick = onSair;
  const r = el.querySelector('[data-repetir]');
  if (r) r.onclick = onRepetir;
  return el;
}

const SONS_FIM = { vitoria: 'vitoria', derrota: 'derrota' };

// ── Partida local (Polígono de Treino / Academia) ───────────────────────────
export function iniciarJogoLocal({ loadout, aoSair, aoDano, nomeAdversario = 'Bot de Treino' }) {
  const { palco, canvas } = criarPalco();
  const partida = new Partida({
    semente: (Math.random() * 1e9) | 0,
    jogadores: [
      { id: 'eu', nome: 'Tu', loadout },
      { id: 'bot', nome: nomeAdversario, loadout: obterClassicos() },
    ],
  });
  const rend = new Renderizador(canvas);
  const controlos = new Controlos();
  controlos.ligarRato(canvas, (mx, my) => rend.paraMundo(mx, my));
  const hud = criarHud(palco, loadout, 'eu');
  const memBot = {};
  let raf = 0, ult = performance.now(), acc = 0;
  let danoBase = 100, rondaAtual = 1, danoRonda = 0, terminada = false;

  const loop = (agora) => {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.1, (agora - ult) / 1000);
    ult = agora;
    acc += dt;
    while (acc >= DT && !terminada) {
      acc -= DT;
      const inp = controlos.consumir();
      partida.definirInput('eu', inp);
      partida.definirInput('bot', inputDoBot(partida, 'bot', memBot));
      partida.passo();
    }
    const snap = partida.snapshot();
    rend.processarEventos(snap.eventos);
    for (const ev of snap.eventos) if (SOM_EVENTO[ev.tipo]) som(SOM_EVENTO[ev.tipo]);
    rend.atualizar(dt);
    rend.desenhar(snap, 'eu');
    hud.atualizar(snap);

    // XP de treino: dano causado ao bot
    if (snap.round !== rondaAtual) { rondaAtual = snap.round; danoBase = 100; }
    const bot = partida.jogadorPorId('bot');
    if (bot) {
      const d = Math.max(0, danoBase - Math.max(0, bot.vida));
      if (d > 0) { danoRonda += d; if (aoDano) aoDano(d); }
      danoBase = Math.max(0, bot.vida);
    }

    if (snap.resultadoFinal && !terminada) {
      terminada = true;
      const venceu = snap.resultadoFinal.vencedor === 'eu';
      som(venceu ? 'vitoria' : 'derrota');
      sobreposicaoFim(palco, {
        venceu,
        titulo: venceu ? 'VITÓRIA ARCANA!' : 'DERROTA…',
        sub: `Placar final: ${snap.resultadoFinal.placar.join(' — ')}`,
        comRepetir: false,
        onRepetir: null,
        onSair: () => aoSair(danoRonda),
      });
      const btnSair = palco.querySelector('[data-sair]');
      if (btnSair) btnSair.focus();
    }
  };
  raf = requestAnimationFrame(loop);

  const esc = (e) => { if (e.key === 'Escape') aoSair(danoRonda); };
  window.addEventListener('keydown', esc);

  return {
    destruir() {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', esc);
      controlos.destruir();
      rend.destruir();
      hud.destruir();
      palco.remove();
    },
  };
}

// ── Duelo online (snapshots do servidor + interpolação) ─────────────────────
export function iniciarJogoOnline({ socket, infoDuelo, loadout, aoSair }) {
  const { palco, canvas } = criarPalco();
  const rend = new Renderizador(canvas);
  const controlos = new Controlos();
  controlos.ligarRato(canvas, (mx, my) => rend.paraMundo(mx, my));
  const hud = criarHud(palco, loadout, infoDuelo.meuId);
  hud.aviso(`Duelo contra ${infoDuelo.adversario.nome}`, true);

  const buffer = []; // snapshots recentes para interpolação
  const ATRASO = 110; // ms de render atrás do último snapshot

  const onEstado = (snap) => {
    buffer.push({ t: performance.now(), snap });
    if (buffer.length > 40) buffer.shift();
    rend.processarEventos(snap.eventos);
    for (const ev of snap.eventos) if (SOM_EVENTO[ev.tipo]) som(SOM_EVENTO[ev.tipo]);
    if (snap.eventos?.some((e) => e.tipo === 'erro')) {
      const evErro = snap.eventos.find((e) => e.tipo === 'erro');
      hud.aviso(evErro.texto, true);
    }
  };
  socket.on('estado', onEstado);

  const envio = setInterval(() => {
    socket.emit('input', controlos.consumir());
  }, 33);

  function interpolado(quando) {
    if (buffer.length === 0) return null;
    let a = buffer[0], b = buffer[buffer.length - 1];
    for (let i = 0; i < buffer.length - 1; i++) {
      if (buffer[i].t <= quando && buffer[i + 1].t >= quando) { a = buffer[i]; b = buffer[i + 1]; break; }
    }
    if (a === b || quando >= b.t) return b.snap;
    if (quando <= a.t) return a.snap;
    const f = (quando - a.t) / (b.t - a.t);
    const lerp = (p, q) => p + (q - p) * f;
    const lerpAng = (p, q) => p + Math.atan2(Math.sin(q - p), Math.cos(q - p)) * f;
    const mistura = JSON.parse(JSON.stringify(b.snap));
    for (const jb of mistura.jogadores) {
      const ja = a.snap.jogadores.find((x) => x.id === jb.id);
      if (ja) { jb.x = lerp(ja.x, jb.x); jb.y = lerp(ja.y, jb.y); jb.angulo = lerpAng(ja.angulo, jb.angulo); }
    }
    for (const eb of mistura.entidades) {
      const ea = a.snap.entidades.find((x) => x.id === eb.id);
      if (ea) {
        if (eb.x != null && ea.x != null) { eb.x = lerp(ea.x, eb.x); eb.y = lerp(ea.y, eb.y); }
        if (eb.x1 != null && ea.x1 != null) { eb.x1 = lerp(ea.x1, eb.x1); eb.y1 = lerp(ea.y1, eb.y1); eb.x2 = lerp(ea.x2, eb.x2); eb.y2 = lerp(ea.y2, eb.y2); }
      }
    }
    return mistura;
  }

  let raf = 0, ult = performance.now();
  const loop = (agora) => {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.1, (agora - ult) / 1000);
    ult = agora;
    const snap = interpolado(agora - ATRASO);
    if (snap) {
      rend.atualizar(dt);
      rend.desenhar(snap, infoDuelo.meuId);
      hud.atualizar(buffer[buffer.length - 1]?.snap ?? snap);
    }
  };
  raf = requestAnimationFrame(loop);

  const esc = (e) => { if (e.key === 'Escape') aoSair(); };
  window.addEventListener('keydown', esc);

  return {
    destruir() {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', esc);
      clearInterval(envio);
      socket.off('estado', onEstado);
      controlos.destruir();
      rend.destruir();
      hud.destruir();
      palco.remove();
    },
  };
}
