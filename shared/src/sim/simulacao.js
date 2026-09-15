// ─────────────────────────────────────────────────────────────────────────────
// Simulação determinística do duelo (corre no servidor e no cliente offline).
// Ticks fixos a 60 Hz, aleatoriedade semeada, ordem de processamento estável.
// ─────────────────────────────────────────────────────────────────────────────
import {
  ARENA, OBSTACULOS, PONTOS_NASCIMENTO, JOGADOR, RODADA, PASSOS,
  LIMITES, ELEMENTOS, SINERGIAS, DISTANCIA_PERTO,
} from '../constantes.js';
import { criarRng } from '../rng.js';
import { chamarHook } from '../sandbox/maquina.js';
import { ErroFeitico } from '../sandbox/compilador.js';
import { traduzirRuntime } from '../sandbox/compilador.js';
import { construirCtx, alvoAplicavel } from '../spells/api.js';

const ESTADOS_VALIDOS = new Set(['queimadura', 'molhado', 'cego', 'lento', 'vento']);

export function inputVazio() {
  return { cima: false, baixo: false, esq: false, dir: false, miraX: 0, miraY: 0, lancar: 0, dash: false };
}

export function colideObstaculo(x, y, r) {
  if (x - r < 0 || y - r < 0 || x + r > ARENA.largura || y + r > ARENA.altura) return true;
  for (const o of OBSTACULOS) {
    const px = Math.max(o.x, Math.min(x, o.x + o.w));
    const py = Math.max(o.y, Math.min(y, o.y + o.h));
    if ((px - x) ** 2 + (py - y) ** 2 < r * r) return true;
  }
  return false;
}

// Primeiro t (0..1) em que o segmento (x1,y1)→(x2,y2) atinge um retângulo; Infinity se livre.
function tColisaoSegmento(x1, y1, x2, y2, o) {
  const dx = x2 - x1, dy = y2 - y1;
  let tMin = 0, tMax = 1;
  for (const [p, d, lo, hi] of [[x1, dx, o.x, o.x + o.w], [y1, dy, o.y, o.y + o.h]]) {
    if (Math.abs(d) < 1e-9) {
      if (p < lo || p > hi) return Infinity;
    } else {
      let t1 = (lo - p) / d, t2 = (hi - p) / d;
      if (t1 > t2) [t1, t2] = [t2, t1];
      tMin = Math.max(tMin, t1);
      tMax = Math.min(tMax, t2);
      if (tMin > tMax) return Infinity;
    }
  }
  return tMin;
}

const limitar = (v, a, b) => Math.min(b, Math.max(a, v));

export class Partida {
  constructor({ semente = 1, jogadores }) {
    this.rng = criarRng(semente);
    this.jogadores = jogadores.slice(0, 2).map((j, i) => ({
      id: j.id, nome: j.nome, equipa: i,
      x: PONTOS_NASCIMENTO[i].x, y: PONTOS_NASCIMENTO[i].y,
      vida: JOGADOR.vidaMax, mana: JOGADOR.manaMax, escudo: 0,
      anguloMira: i === 0 ? 0 : Math.PI,
      loadout: (j.loadout ?? []).slice(0, 6),
      recargas: new Array(6).fill(0),
      estados: [], ativos: [],
      dashT: 0, dashCdT: 0, dashDirX: 1, dashDirY: 0,
      input: inputVazio(), pendLancar: 0, pendDash: false,
      hookCd: {}, // cooldowns internos dos hooks reativos
      errosRodada: 0,
    }));
    this.entidades = [];
    this.proximoId = 1;
    this.eventos = [];
    this.logs = [];
    this.tick = 0;
    this.round = 1;
    this.placar = [0, 0];
    this.tRestante = RODADA.duracao;
    this.fase = 'luta'; // luta | fimRound | fimPartida
    this.fimRoundT = 0;
    this.sobremorte = false;
    this.vencedorRound = null;
    this.resultadoFinal = null;
  }

  // ── Consultas para bot / HUD ───────────────────────────────────────────────
  jogadorPorId(id) { return this.jogadores.find((j) => j.id === id) ?? null; }
  inimigoDe(id) {
    return this.jogadores.find((j) => j.id !== id) ?? null;
  }
  alvoMira(jog) {
    const d = 420;
    return { x: jog.x + Math.cos(jog.anguloMira) * d, y: jog.y + Math.sin(jog.anguloMira) * d };
  }
  consultar(id) {
    const eu = this.jogadorPorId(id);
    if (!eu) return null;
    const e = this.inimigoDe(id);
    return {
      x: eu.x, y: eu.y, vida: eu.vida, mana: eu.mana, dashPronto: eu.dashCdT <= 0,
      recargas: eu.recargas.slice(),
      inimigo: e ? { x: e.x, y: e.y, vida: e.vida } : null,
      projeteis: this.entidades
        .filter((en) => en.tipo === 'projetil' && en.dono !== id)
        .map((en) => ({ x: en.x, y: en.y, vx: en.vx, vy: en.vy })),
      tRestante: this.tRestante, fase: this.fase,
    };
  }

  // ── Entradas ───────────────────────────────────────────────────────────────
  definirInput(id, entrada) {
    const j = this.jogadorPorId(id);
    if (!j || this.fase === 'fimPartida') return;
    Object.assign(j.input, {
      cima: !!entrada.cima, baixo: !!entrada.baixo, esq: !!entrada.esq, dir: !!entrada.dir,
      miraX: entrada.miraX ?? j.input.miraX, miraY: entrada.miraY ?? j.input.miraY,
    });
    if (entrada.lancar) j.pendLancar |= entrada.lancar | 0;
    if (entrada.dash) j.pendDash = true;
  }

  // ── Um tick de simulação ───────────────────────────────────────────────────
  passo() {
    if (this.fase === 'fimPartida') return;
    const dt = 1 / 60;
    this.tick++;

    if (this.fase === 'fimRound') {
      this.fimRoundT -= dt;
      if (this.fimRoundT <= 0) this.iniciarRound(this.round + 1);
      this.eventos.push(...[]);
      return;
    }

    // cronómetro da ronda (congela na morte súbita)
    if (!this.sobremorte) {
      this.tRestante -= dt;
      if (this.tRestante <= 0) {
        this.tRestante = 0;
        this.sobremorte = true;
        this.sobremorteT = 0;
        this.eventos.push({ tipo: 'sobremorte' });
      }
    } else {
      this.sobremorteT += dt;
      if (this.sobremorteT > 15) {
        // 15s de morte súbita sem vítima: desempate sempre decisivo
        const [a, b] = this.jogadores;
        let perdedor;
        if (a.vida !== b.vida) perdedor = a.vida < b.vida ? a : b;
        else if (a.mana !== b.mana) perdedor = a.mana < b.mana ? a : b;
        else perdedor = this.rng() < 0.5 ? a : b;
        perdedor.vida = 0;
        this.fimRound(perdedor);
      }
    }

    for (const j of this.jogadores) this.passoJogador(j, dt);
    for (const j of this.jogadores) this.hooksReativos(j);
    this.passoEntidades(dt);
    this.passoEstados(dt);
  }

  passoJogador(j, dt) {
    const ent = j.input;

    // mira
    if (ent.miraX != null && this.fase === 'luta') {
      j.anguloMira = Math.atan2(ent.miraY - j.y, ent.miraX - j.x);
    }

    // movimento
    let ix = (ent.dir ? 1 : 0) - (ent.esq ? 1 : 0);
    let iy = (ent.baixo ? 1 : 0) - (ent.cima ? 1 : 0);
    const l = Math.hypot(ix, iy) || 1;
    ix /= l; iy /= l;
    if (ix !== 0 || iy !== 0) { j.dashDirX = ix; j.dashDirY = iy; }

    let vx = 0, vy = 0;
    const lentidao = j.estados.some((e) => e.estado === 'lento') ? 0.55 : 1;
    if (j.dashT > 0) {
      vx = j.dashDirX * JOGADOR.dashVel; vy = j.dashDirY * JOGADOR.dashVel;
      if (this.tick % 2 === 0) this.eventos.push({ tipo: 'rastro', x: j.x, y: j.y, cor: '#9be7ff' });
    } else if (this.fase === 'luta') {
      vx = ix * JOGADOR.velocidade * lentidao; vy = iy * JOGADOR.velocidade * lentidao;
    }

    const nx = j.x + vx * dt, ny = j.y + vy * dt;
    if (!colideObstaculo(nx, j.y, JOGADOR.raio)) j.x = nx;
    if (!colideObstaculo(j.x, ny, JOGADOR.raio)) j.y = ny;
    j.vx = vx; j.vy = vy; // velocidade real (útil para mira preditiva)
    j.x = limitar(j.x, JOGADOR.raio, ARENA.largura - JOGADOR.raio);
    j.y = limitar(j.y, JOGADOR.raio, ARENA.altura - JOGADOR.raio);

    // dash (tecla espaço)
    if (j.pendDash && j.dashCdT <= 0 && this.fase === 'luta') {
      j.dashT = JOGADOR.dashDur; j.dashCdT = JOGADOR.dashCd;
      this.eventos.push({ tipo: 'dash', x: j.x, y: j.y });
    }
    j.pendDash = false;
    j.dashT -= dt; j.dashCdT -= dt;

    // lançamentos (bitmask de teclas 1..6 recém-pressionadas)
    for (let s = 0; s < 6; s++) {
      if (j.pendLancar & (1 << s)) this.tentarLancar(j, s);
    }
    j.pendLancar = 0;

    // recargas, mana, hooks aCadaTick
    for (let i = 0; i < 6; i++) if (j.recargas[i] > 0) j.recargas[i] -= dt;
    j.mana = Math.min(JOGADOR.manaMax, j.mana + JOGADOR.regenMana * dt);

    for (let i = j.ativos.length - 1; i >= 0; i--) {
      const a = j.ativos[i];
      a.t -= dt;
      if (a.t <= 0) { j.ativos.splice(i, 1); continue; }
      const ctx = construirCtx(this, j, a.feitico, a.contagem);
      try {
        chamarHook(a.feitico, 'aCadaTick', ctx, PASSOS.aCadaTick, this.rng);
      } catch (e) {
        this.registarErro(j, e);
        j.ativos.splice(i, 1);
      }
    }
  }

  tentarLancar(jog, slot) {
    const f = jog.loadout[slot];
    if (!f || this.fase !== 'luta') return;
    if (jog.recargas[slot] > 0) return;
    if (jog.mana < f.custoMana) {
      this.eventos.push({ tipo: 'semMana', x: jog.x, y: jog.y - 26 });
      return;
    }
    jog.mana -= f.custoMana;
    jog.recargas[slot] = f.recarga;
    this.eventos.push({ tipo: 'lancou', x: jog.x, y: jog.y, cor: ELEMENTOS[f.elemento].cor });
    const contagem = { invocacoes: 0 };
    const ctx = construirCtx(this, jog, f, contagem);
    try {
      chamarHook(f, 'aoLancar', ctx, PASSOS.aoLancar, this.rng);
    } catch (e) {
      this.registarErro(jog, e);
    }
    if (f.hooks.aCadaTick) jog.ativos.push({ feitico: f, t: f.duracaoAtiva, contagem });
  }

  hooksReativos(j) {
    const e = this.inimigoDe(j.id);
    j.loadout.forEach((f, slot) => {
      if (!f) return;
      const ctx = construirCtx(this, j, f, { invocacoes: 0 });
      // proximidade
      if (f.hooks.quandoInimigoPerto || f.hooks.quandoInimigoLonge) {
        const chave = `prox${slot}`;
        const perto = e ? Math.hypot(e.x - j.x, e.y - j.y) <= DISTANCIA_PERTO : false;
        const antes = j.hookCd[chave + '_perto'] === true;
        if (perto && !antes && f.hooks.quandoInimigoPerto && (j.hookCd[chave + 't'] ?? 0) <= 0) {
          j.hookCd[chave + 't'] = 1.2;
          try { chamarHook(f, 'quandoInimigoPerto', ctx, PASSOS.evento, this.rng); } catch (err) { this.registarErro(j, err); }
        }
        if (!perto && antes && f.hooks.quandoInimigoLonge && (j.hookCd[chave + 't'] ?? 0) <= 0) {
          j.hookCd[chave + 't'] = 1.2;
          try { chamarHook(f, 'quandoInimigoLonge', ctx, PASSOS.evento, this.rng); } catch (err) { this.registarErro(j, err); }
        }
        j.hookCd[chave + '_perto'] = perto;
        if (j.hookCd[chave + 't'] > 0) j.hookCd[chave + 't'] -= 1 / 60;
      }
      // vida baixa
      if (f.hooks.quandoVidaBaixa) {
        const chaveB = `vidabaixa${slot}`;
        const baixa = j.vida < JOGADOR.vidaMax * 0.3;
        if (baixa && !j.hookCd[chaveB] && (j.hookCd[chaveB + 't'] ?? 0) <= 0) {
          j.hookCd[chaveB] = true; j.hookCd[chaveB + 't'] = 8;
          try { chamarHook(f, 'quandoVidaBaixa', ctx, PASSOS.evento, this.rng); } catch (err) { this.registarErro(j, err); }
        }
        if (!baixa && j.vida > JOGADOR.vidaMax * 0.5) j.hookCd[chaveB] = false;
        if (j.hookCd[chaveB + 't'] > 0) j.hookCd[chaveB + 't'] -= 1 / 60;
      }
    });
  }

  // ── Invocações da API ──────────────────────────────────────────────────────
  invocar(dono, feitico, contagem, op = {}) {
    if (contagem && ++contagem.invocacoes > LIMITES.entidadesPorLancamento) {
      throw new ErroFeitico('O feitiço tentou invocar entidades demais num único lançamento.');
    }
    if (this.entidades.length >= LIMITES.entidadesTotais) {
      throw new ErroFeitico('A arena está saturada de magia — não é possível invocar mais agora.');
    }
    const tipo = String(op.tipo ?? '');
    const cor = ELEMENTOS[op.elemento && ELEMENTOS[op.elemento] ? op.elemento : feitico.elemento].cor;

    switch (tipo) {
      case 'projetil': return this.invocarProjetil(dono, feitico, op, cor);
      case 'feixe': return this.invocarFeixe(dono, feitico, op, cor);
      case 'area': return this.invocarArea(dono, feitico, op, cor);
      case 'armadilha': return this.invocarArmadilha(dono, feitico, op, cor);
      case 'escudo': return this.criarEscudo(dono, op);
      case 'aura': return this.criarAura(dono, op);
      case 'dash': return this.dashMagico(dono, op);
      case 'teleporte': return this.teleporteMagico(dono, op);
      default: throw new ErroFeitico(`Componente mágico desconhecido: «${tipo}». Componentes válidos: projetil, feixe, area, escudo, dash, teleporte, armadilha, aura.`);
    }
  }

  normalizarEfeitos(op) {
    const lista = Array.isArray(op.efeitos) ? op.efeitos : (op.efeitos ? [op.efeitos] : []);
    return lista.slice(0, 3).map((e) => ({
      estado: String(e.estado ?? e.tipo ?? ''),
      dps: limitar(Number(e.dps) || 0, 0, 10),
      duracao: limitar(Number(e.duracao) || 3, 0.5, 8),
      forca: limitar(Number(e.forca) || 120, 0, 500),
    })).filter((e) => ESTADOS_VALIDOS.has(e.estado));
  }

  invocarProjetil(dono, feitico, op, cor) {
    let dir = Number(op.direcao ?? op.angulo ?? dono.anguloMira);
    if (!Number.isFinite(dir)) dir = dono.anguloMira;
    if (dono.estados.some((e) => e.estado === 'cego')) dir += (this.rng() - 0.5) * 0.55;
    const vel = limitar(Number(op.velocidade) || 320, 60, 900);
    this.entidades.push({
      id: this.proximoId++, tipo: 'projetil', dono: dono.id, elemento: feitico.elemento,
      x: dono.x + Math.cos(dir) * (JOGADOR.raio + 6), y: dono.y + Math.sin(dir) * (JOGADOR.raio + 6),
      vx: Math.cos(dir) * vel, vy: Math.sin(dir) * vel,
      dano: limitar(Number(op.dano) || 6, 0, 40), raio: limitar(Number(op.raio) || 6, 3, 18),
      ttl: limitar(Number(op.vida) || 2.5, 0.2, 6), efeitos: this.normalizarEfeitos(op),
      aoAcertar: typeof op.aoAcertar === 'function' ? op.aoAcertar : null, feitico, cor,
    });
  }

  invocarFeixe(dono, feitico, op, cor) {
    let dir = Number(op.direcao ?? dono.anguloMira);
    if (!Number.isFinite(dir)) dir = dono.anguloMira;
    if (dono.estados.some((e) => e.estado === 'cego')) dir += (this.rng() - 0.5) * 0.55;
    const alcance = limitar(Number(op.alcance) || 380, 60, 700);
    const dano = limitar(Number(op.dano) || 14, 0, 40);
    const largura = limitar(Number(op.largura) || 8, 3, 24);
    let t = alcance;
    const x1 = dono.x, y1 = dono.y;
    const x2 = x1 + Math.cos(dir) * alcance, y2 = y1 + Math.sin(dir) * alcance;
    for (const o of OBSTACULOS) {
      const frac = tColisaoSegmento(x1, y1, x2, y2, o); // fração 0..1 ao longo do segmento
      if (frac * alcance < t) t = frac * alcance;        // converte para unidades
    }
    const fimX = x1 + Math.cos(dir) * t, fimY = y1 + Math.sin(dir) * t;
    // dano a todos os inimigos perto do segmento
    for (const j of this.jogadores) {
      if (j.id === dono.id || j.vida <= 0) continue;
      const td = ((j.x - x1) * (x2 - x1) + (j.y - y1) * (y2 - y1)) / (alcance * alcance);
      if (td < 0 || td * alcance > t) continue;
      const px = x1 + (x2 - x1) * td, py = y1 + (y2 - y1) * td;
      if (Math.hypot(j.x - px, j.y - py) < largura / 2 + JOGADOR.raio) {
        this.danoDireto(j, dano, dono.id);
        for (const ef of this.normalizarEfeitos(op)) this.aplicarEstado(j, ef, dir);
      }
    }
    this.entidades.push({
      id: this.proximoId++, tipo: 'feixe', dono: dono.id, elemento: feitico.elemento,
      x1, y1, x2: fimX, y2: fimY, largura, t: limitar(Number(op.duracao) || 0.22, 0.08, 0.6), cor,
    });
  }

  invocarArea(dono, feitico, op, cor) {
    const emMira = op.centro === 'mira' || op.em === 'mira';
    const cx = emMira ? limitar(dono.x + Math.cos(dono.anguloMira) * 220, 0, ARENA.largura) : dono.x;
    const cy = emMira ? limitar(dono.y + Math.sin(dono.anguloMira) * 220, 0, ARENA.altura) : dono.y;
    const raio = limitar(Number(op.raio) || 70, 20, 160);
    const dano = limitar(Number(op.dano) || 14, 0, 45);
    const efeitos = this.normalizarEfeitos(op);
    for (const j of this.jogadores) {
      if (j.id === dono.id || j.vida <= 0) continue;
      if (Math.hypot(j.x - cx, j.y - cy) < raio + JOGADOR.raio) {
        this.danoDireto(j, dano, dono.id);
        for (const ef of efeitos) this.aplicarEstado(j, ef, Math.atan2(j.y - cy, j.x - cx));
      }
    }
    this.entidades.push({ id: this.proximoId++, tipo: 'area', dono: dono.id, elemento: feitico.elemento, x: cx, y: cy, raio, t: 0.5, cor });
  }

  invocarArmadilha(dono, feitico, op, cor) {
    let dir = Number(op.direcao ?? dono.anguloMira);
    const dist = limitar(Number(op.distancia) || 80, 20, 260);
    const x = limitar(dono.x + Math.cos(dir) * dist, 20, ARENA.largura - 20);
    const y = limitar(dono.y + Math.sin(dir) * dist, 20, ARENA.altura - 20);
    this.entidades.push({
      id: this.proximoId++, tipo: 'armadilha', dono: dono.id, elemento: feitico.elemento,
      x, y, raio: limitar(Number(op.raio) || 34, 20, 70),
      dano: limitar(Number(op.dano) || 15, 0, 40), efeitos: this.normalizarEfeitos(op),
      t: limitar(Number(op.duracao) || 8, 1, 20), armamento: 0.6, cor,
    });
  }

  criarEscudo(dono, op = {}) {
    const vida = limitar(Number(op.vida) || 40, 5, JOGADOR.escudoMax);
    dono.escudo = Math.min(JOGADOR.escudoMax, dono.escudo + vida);
    this.eventos.push({ tipo: 'escudo', x: dono.x, y: dono.y });
  }

  criarAura(dono, op = {}) {
    this.entidades.push({
      id: this.proximoId++, tipo: 'aura', dono: dono.id, elemento: op.elemento && ELEMENTOS[op.elemento] ? op.elemento : 'arcano',
      raio: limitar(Number(op.raio) || 90, 40, 160),
      dps: limitar(Number(op.dps) || 4, 0, 12),
      t: limitar(Number(op.duracao) || 4, 1, 10),
      cor: ELEMENTOS[op.elemento && ELEMENTOS[op.elemento] ? op.elemento : 'arcano'].cor,
    });
  }

  moverPasso(j, dx, dy) { // desloca com colisão, passo pequeno
    const passos = Math.ceil(Math.hypot(dx, dy) / 6) || 1;
    const px = dx / passos, py = dy / passos;
    for (let i = 0; i < passos; i++) {
      if (!colideObstaculo(j.x + px, j.y, JOGADOR.raio)) j.x += px;
      if (!colideObstaculo(j.x, j.y + py, JOGADOR.raio)) j.y += py;
    }
    j.x = limitar(j.x, JOGADOR.raio, ARENA.largura - JOGADOR.raio);
    j.y = limitar(j.y, JOGADOR.raio, ARENA.altura - JOGADOR.raio);
  }

  dashMagico(dono, op = {}) {
    const dist = limitar(Number(op.distancia) || 130, 40, 220);
    const dir = Number.isFinite(Number(op.direcao)) ? Number(op.direcao) : dono.anguloMira;
    this.moverPasso(dono, Math.cos(dir) * dist, Math.sin(dir) * dist);
    this.eventos.push({ tipo: 'dash', x: dono.x, y: dono.y });
  }

  teleporteMagico(dono, op = {}) {
    const dist = limitar(Number(op.distancia) || 200, 60, 260);
    const dir = Number.isFinite(Number(op.direcao)) ? Number(op.direcao) : dono.anguloMira;
    const alvoX = dono.x + Math.cos(dir) * dist, alvoY = dono.y + Math.sin(dir) * dist;
    if (!colideObstaculo(alvoX, alvoY, JOGADOR.raio)) {
      dono.x = limitar(alvoX, JOGADOR.raio, ARENA.largura - JOGADOR.raio);
      dono.y = limitar(alvoY, JOGADOR.raio, ARENA.altura - JOGADOR.raio);
    } else {
      // recua gradual até encontrar espaço livre
      for (let d = dist; d > 20; d -= 12) {
        const x = dono.x + Math.cos(dir) * d, y = dono.y + Math.sin(dir) * d;
        if (!colideObstaculo(x, y, JOGADOR.raio)) { dono.x = x; dono.y = y; break; }
      }
    }
    this.eventos.push({ tipo: 'teleporte', x: dono.x, y: dono.y, cor: '#c77dff' });
  }

  empurrar(alvo, ang, forca = 120) {
    const d = limitar(forca, 0, 500) * 0.18;
    this.moverPasso(alvo, Math.cos(ang) * d, Math.sin(ang) * d);
  }

  registarLog(jog, args) {
    if (this.logs.length > 60) this.logs.shift();
    this.logs.push({ jogador: jog.id, texto: args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ') });
  }

  registarErro(jog, e) {
    if (jog.errosRodada > 8) return;
    jog.errosRodada++;
    this.eventos.push({ tipo: 'erro', dono: jog.id, texto: traduzirRuntime(e) });
  }

  // ── Dano, estados e sinergias ──────────────────────────────────────────────
  danoDireto(alvo, dano, fonteId) {
    if (this.fase !== 'luta' || dano <= 0 || alvo.vida <= 0) return;
    let d = dano;
    if (alvo.escudo > 0) {
      const absorvido = Math.min(alvo.escudo, d);
      alvo.escudo -= absorvido; d -= absorvido;
      if (alvo.escudo <= 0) this.eventos.push({ tipo: 'quebra', x: alvo.x, y: alvo.y });
    }
    alvo.vida -= d;
    this.eventos.push({ tipo: 'dano', x: alvo.x, y: alvo.y - 10, valor: Math.round(dano), cor: '#ffd166' });
    if (this.sobremorte) alvo.vida = Math.min(alvo.vida, 0);
    // hook aoSerAcertado dos feitiços equipados de QUEM É ATINGIDO
    for (const f of alvo.loadout) {
      if (!f?.hooks?.aoSerAcertado) continue;
      const ctx = construirCtx(this, alvo, f, { invocacoes: 0 });
      try { chamarHook(f, 'aoSerAcertado', ctx, PASSOS.evento, this.rng); } catch (e) { this.registarErro(alvo, e); }
    }
    if (alvo.vida <= 0) this.fimRound(alvo);
  }

  aplicarEstado(alvo, efeito, dirEmpurro) {
    if (this.fase !== 'luta' || alvo.vida <= 0) return;
    const sin1 = SINERGIAS[`${efeito.estado}+molhado`];
    const tem = (s) => alvo.estados.find((e) => e.estado === s);
    if (efeito.estado === 'queimadura') {
      if (tem('molhado')) {
        alvo.estados = alvo.estados.filter((e) => e.estado !== 'molhado');
        alvo.estados.push({ estado: 'cego', t: 2, ac: 0 });
        this.danoDireto(alvo, sin1.danoExtra, null);
        this.eventos.push({ tipo: 'sinergia', x: alvo.x, y: alvo.y - 20, texto: sin1.texto, cor: '#9be7ff' });
        return;
      }
      if (tem('vento')) {
        alvo.estados = alvo.estados.filter((e) => e.estado !== 'vento');
        this.danoDireto(alvo, SINERGIAS['queimadura+vento'].danoExtra, null);
        this.eventos.push({ tipo: 'sinergia', x: alvo.x, y: alvo.y - 20, texto: 'EXPLOSÃO!', cor: '#ff7a3c' });
      }
    }
    if (efeito.estado === 'molhado' && tem('queimadura')) {
      alvo.estados = alvo.estados.filter((e) => e.estado !== 'queimadura');
      alvo.vida = Math.min(JOGADOR.vidaMax, alvo.vida + 3);
      this.eventos.push({ tipo: 'sinergia', x: alvo.x, y: alvo.y - 20, texto: 'EXTINGUIDO', cor: '#3cc8ff' });
      return;
    }
    if (efeito.estado === 'vento') {
      this.empurrar(alvo, dirEmpurro ?? 0, efeito.forca);
      this.eventos.push({ tipo: 'vento', x: alvo.x, y: alvo.y });
    }
    const existente = tem(efeito.estado);
    if (existente) existente.t = Math.max(existente.t, efeito.duracao);
    else alvo.estados.push({ estado: efeito.estado, dps: efeito.dps, t: efeito.duracao, ac: 0 });
  }

  passoEstados(dt) {
    for (const j of this.jogadores) {
      for (let i = j.estados.length - 1; i >= 0; i--) {
        const e = j.estados[i];
        e.t -= dt;
        if (e.estado === 'queimadura' && e.dps > 0) {
          e.ac += e.dps * dt;
          if (e.ac >= 1) { const d = e.ac; e.ac = 0; this.danoDireto(j, d, null); }
        }
        if (e.t <= 0) j.estados.splice(i, 1);
      }
    }
  }

  // ── Entidades ──────────────────────────────────────────────────────────────
  passoEntidades(dt) {
    const vivas = [];
    for (const e of this.entidades) {
      switch (e.tipo) {
        case 'projetil': if (this.passoProjetil(e, dt)) vivas.push(e); break;
        case 'feixe': case 'area': e.t -= dt; if (e.t > 0) vivas.push(e); break;
        case 'armadilha': if (this.passoArmadilha(e, dt)) vivas.push(e); break;
        case 'aura': if (this.passoAura(e, dt)) vivas.push(e); break;
        default: vivas.push(e);
      }
    }
    this.entidades = vivas;
  }

  passoProjetil(e, dt) {
    e.x += e.vx * dt; e.y += e.vy * dt; e.ttl -= dt;
    if (e.ttl <= 0 || colideObstaculo(e.x, e.y, e.raio)) {
      this.eventos.push({ tipo: 'spark', x: e.x, y: e.y, cor: e.cor });
      return false;
    }
    for (const j of this.jogadores) {
      if (j.id === e.dono || j.vida <= 0) continue;
      if (Math.hypot(j.x - e.x, j.y - e.y) < e.raio + JOGADOR.raio) {
        this.danoDireto(j, e.dano, e.dono);
        for (const ef of e.efeitos) this.aplicarEstado(j, ef, Math.atan2(e.vy, e.vx));
        if (e.aoAcertar) {
          try {
            let n = 0;
            const feitico = e.feitico;
            feitico.__despPasso.definirAlvo((linha) => { if (++n > PASSOS.evento) throw new ErroFeitico(`O encantamento aoAcertar consumiu energia demais.`); });
            feitico.__despRng.definirAlvo(() => this.rng());
            try { e.aoAcertar(alvoAplicavel(this, j)); } finally {
              feitico.__despPasso.definirAlvo(null); feitico.__despRng.definirAlvo(null);
            }
          } catch (err) { this.registarErro(this.jogadorPorId(e.dono) ?? this.jogadores[0], err); }
        }
        this.eventos.push({ tipo: 'impacto', x: e.x, y: e.y, cor: e.cor });
        return false;
      }
    }
    // parry mágico: projéteis de donos diferentes destroem-se
    for (const o of this.entidades) {
      if (o !== e && o.tipo === 'projetil' && o.dono !== e.dono && Math.hypot(o.x - e.x, o.y - e.y) < o.raio + e.raio) {
        o.ttl = 0; e.ttl = 0;
        this.eventos.push({ tipo: 'parry', x: (o.x + e.x) / 2, y: (o.y + e.y) / 2 });
        return false;
      }
    }
    return true;
  }

  passoArmadilha(e, dt) {
    e.t -= dt;
    if (e.armamento > 0) { e.armamento -= dt; return e.t > 0; }
    for (const j of this.jogadores) {
      if (j.id === e.dono || j.vida <= 0) continue;
      if (Math.hypot(j.x - e.x, j.y - e.y) < e.raio + JOGADOR.raio) {
        this.danoDireto(j, e.dano, e.dono);
        for (const ef of e.efeitos) this.aplicarEstado(j, ef, Math.atan2(j.y - e.y, j.x - e.x));
        this.eventos.push({ tipo: 'impacto', x: e.x, y: e.y, cor: e.cor });
        return false;
      }
    }
    return e.t > 0;
  }

  passoAura(e, dt) {
    e.t -= dt;
    const dono = this.jogadorPorId(e.dono);
    if (dono) { e.x = dono.x; e.y = dono.y; }
    if (e.t <= 0 || !dono || dono.vida <= 0) return false;
    e.ac = (e.ac ?? 0) + e.dps / 60;
    if (e.ac >= 1) {
      const d = e.ac; e.ac = 0;
      for (const j of this.jogadores) {
        if (j.id === e.dono || j.vida <= 0) continue;
        if (Math.hypot(j.x - e.x, j.y - e.y) < e.raio) this.danoDireto(j, d, e.dono);
      }
    }
    return true;
  }

  // ── Rondas e fim de partida ────────────────────────────────────────────────
  fimRound(perdedor) {
    if (this.fase !== 'luta') return;
    const vencedor = this.jogadores.find((j) => j.id !== perdedor.id);
    this.fase = 'fimRound';
    this.fimRoundT = 2.2;
    this.vencedorRound = vencedor.id;
    this.placar[vencedor.equipa]++;
    this.eventos.push({ tipo: 'morte', x: perdedor.x, y: perdedor.y, vencedor: vencedor.id });
    if (this.placar[vencedor.equipa] >= RODADA.roundsParaVencer) {
      this.fase = 'fimPartida';
      this.resultadoFinal = { vencedor: vencedor.id, placar: this.placar.slice() };
    }
  }

  iniciarRound(n) {
    this.round = n;
    this.entidades = [];
    this.tRestante = RODADA.duracao;
    this.sobremorte = false;
    this.vencedorRound = null;
    this.fase = 'luta';
    this.jogadores.forEach((j, i) => {
      j.x = PONTOS_NASCIMENTO[i].x; j.y = PONTOS_NASCIMENTO[i].y;
      j.vida = JOGADOR.vidaMax; j.mana = JOGADOR.manaMax; j.escudo = 0;
      j.estados = []; j.ativos = []; j.recargas = new Array(6).fill(0);
      j.dashT = 0; j.dashCdT = 0; j.errosRodada = 0; j.hookCd = {};
      j.anguloMira = i === 0 ? 0 : Math.PI;
    });
    this.eventos.push({ tipo: 'round', numero: n, placar: this.placar.slice() });
  }

  snapshot() {
    const s = {
      t: this.tick,
      round: this.round,
      placar: this.placar.slice(),
      tRestante: Math.max(0, this.tRestante),
      fase: this.fase,
      sobremorte: this.sobremorte,
      vencedorRound: this.vencedorRound,
      resultadoFinal: this.resultadoFinal,
      jogadores: this.jogadores.map((j) => ({
        id: j.id, nome: j.nome, equipa: j.equipa,
        x: +j.x.toFixed(1), y: +j.y.toFixed(1), angulo: +j.anguloMira.toFixed(3),
        vida: Math.max(0, Math.round(j.vida)), mana: Math.round(j.mana), escudo: Math.round(j.escudo),
        estados: j.estados.map((e) => e.estado),
        recargas: j.recargas.map((r) => +r.toFixed(2)),
        dashPronto: j.dashCdT <= 0,
      })),
      entidades: this.entidades.map((e) => ({
        id: e.id, tipo: e.tipo, dono: e.dono, elemento: e.elemento,
        x: e.x1 != null ? undefined : +e.x.toFixed(1),
        y: e.y1 != null ? undefined : +e.y.toFixed(1),
        x1: e.x1 != null ? +e.x1.toFixed(1) : undefined,
        y1: e.y1 != null ? +e.y1.toFixed(1) : undefined,
        x2: e.x2 != null ? +e.x2.toFixed(1) : undefined,
        y2: e.y2 != null ? +e.y2.toFixed(1) : undefined,
        angulo: e.vx != null ? +Math.atan2(e.vy, e.vx).toFixed(3) : (e.angulo ?? undefined),
        raio: e.raio ?? undefined, largura: e.largura ?? undefined, cor: e.cor,
        t: e.t != null ? +e.t.toFixed(2) : undefined,
        armamento: e.armamento != null ? +e.armamento.toFixed(2) : undefined,
      })),
      eventos: this.eventos,
    };
    this.eventos = [];
    return s;
  }
}
