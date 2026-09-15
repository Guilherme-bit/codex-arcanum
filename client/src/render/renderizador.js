// Renderizador Canvas 2D da arena: fundo arcano, entidades, partículas e juice.
import { ARENA, OBSTACULOS, ELEMENTOS } from '@codex/shared';

const COR_EQUIPA = ['#ffd166', '#ff5c7a']; // eu / adversário

export class Renderizador {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.escala = 1;
    this.offX = 0;
    this.offY = 0;
    this.particulas = [];
    this.textos = [];
    this.shake = 0;
    this.tempo = 0;
    this._redim = () => this.redimensionar();
    window.addEventListener('resize', this._redim);
    this.redimensionar();
  }

  redimensionar() {
    const pai = this.canvas.parentElement;
    const dpr = window.devicePixelRatio || 1;
    this.w = pai.clientWidth;
    this.h = pai.clientHeight;
    this.canvas.width = Math.max(1, Math.floor(this.w * dpr));
    this.canvas.height = Math.max(1, Math.floor(this.h * dpr));
    this.dpr = dpr;
    this.escala = Math.min(this.w / ARENA.largura, this.h / ARENA.altura) * 0.97;
    this.offX = (this.w - ARENA.largura * this.escala) / 2;
    this.offY = (this.h - ARENA.altura * this.escala) / 2;
  }

  // Converte coordenadas do rato (px CSS) para coordenadas do mundo
  paraMundo(mx, my) {
    return { x: (mx - this.offX) / this.escala, y: (my - this.offY) / this.escala };
  }

  destruir() { window.removeEventListener('resize', this._redim); }

  // ── efeitos a partir dos eventos da simulação ──────────────
  processarEventos(eventos) {
    for (const ev of eventos ?? []) {
      switch (ev.tipo) {
        case 'lancou': this.jato(ev.x, ev.y, ev.cor, 6, 130); break;
        case 'impacto': case 'spark': this.jato(ev.x, ev.y, ev.cor, 10, 190); break;
        case 'dano':
          this.jato(ev.x, ev.y, ev.cor, 8, 210);
          this.textos.push({ x: ev.x + (Math.random() - 0.5) * 18, y: ev.y - 18, texto: String(ev.valor ?? ''), cor: ev.cor, t: 0.9, vy: -55 });
          this.shake = Math.min(9, this.shake + 2.2);
          break;
        case 'morte': this.jato(ev.x, ev.y, '#ffffff', 40, 340); this.jato(ev.x, ev.y, '#ffd166', 24, 260); this.shake = 12; break;
        case 'parry': this.jato(ev.x, ev.y, '#ffffff', 22, 300); this.textos.push({ x: ev.x, y: ev.y - 20, texto: 'PARRY!', cor: '#ffffff', t: 0.9, vy: -50 }); this.shake = 6; break;
        case 'quebra': this.jato(ev.x, ev.y, '#a0dcff', 20, 260); this.textos.push({ x: ev.x, y: ev.y - 24, texto: 'ESCUDO QUEBRADO', cor: '#a0dcff', t: 1.1, vy: -40 }); break;
        case 'sinergia': this.jato(ev.x, ev.y, ev.cor, 18, 240); this.textos.push({ x: ev.x, y: ev.y, texto: ev.texto, cor: ev.cor, t: 1.1, vy: -46 }); this.shake = 5; break;
        case 'dash': case 'teleporte': this.jato(ev.x, ev.y, ev.cor ?? '#9be7ff', 12, 200); break;
        case 'vento': this.jato(ev.x, ev.y, '#a9f5c8', 14, 220); break;
        case 'escudo': this.jato(ev.x, ev.y, '#a0dcff', 12, 170); break;
        case 'sobremorte': this.textos.push({ x: ARENA.largura / 2, y: 130, texto: '☠ MORTE SÚBITA ☠', cor: '#ff5c7a', t: 2.2, vy: -14 }); break;
        case 'round': this.textos.push({ x: ARENA.largura / 2, y: 150, texto: `RONDA ${ev.numero}`, cor: '#ffd166', t: 1.8, vy: -12 }); break;
        case 'rastro': this.particulas.push({ x: ev.x, y: ev.y, vx: 0, vy: 0, t: 0.3, vida: 0.3, cor: ev.cor, tam: 4 }); break;
        case 'semMana': this.textos.push({ x: ev.x, y: ev.y, texto: 'sem mana…', cor: '#7cc4ff', t: 0.7, vy: -35 }); break;
        default: break;
      }
    }
  }

  jato(x, y, cor, n, forca) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = forca * (0.35 + Math.random() * 0.65);
      this.particulas.push({
        x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
        t: 0.4 + Math.random() * 0.4, vida: 0.8, cor, tam: 1.6 + Math.random() * 2.6,
      });
    }
  }

  atualizar(dt) {
    this.tempo += dt;
    this.shake = Math.max(0, this.shake - dt * 26);
    for (let i = this.particulas.length - 1; i >= 0; i--) {
      const p = this.particulas[i];
      p.t -= dt;
      if (p.t <= 0) { this.particulas.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vx *= 0.92; p.vy *= 0.92;
    }
    for (let i = this.textos.length - 1; i >= 0; i--) {
      const t = this.textos[i];
      t.t -= dt;
      if (t.t <= 0) { this.textos.splice(i, 1); continue; }
      t.y += t.vy * dt;
    }
  }

  desenhar(snap, meuId) {
    const c = this.ctx;
    const dpr = this.dpr;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, this.w, this.h);
    const sh = this.shake;
    const sx = sh ? (Math.random() - 0.5) * sh : 0;
    const sy = sh ? (Math.random() - 0.5) * sh : 0;
    c.setTransform(dpr * this.escala, 0, 0, dpr * this.escala, dpr * (this.offX + sx), dpr * (this.offY + sy));

    // fundo da arena
    const g = c.createRadialGradient(ARENA.largura / 2, ARENA.altura / 2, 60, ARENA.largura / 2, ARENA.altura / 2, 620);
    g.addColorStop(0, '#1d1440');
    g.addColorStop(1, '#0b0718');
    c.fillStyle = g;
    c.fillRect(0, 0, ARENA.largura, ARENA.altura);

    // grelha arcana
    c.strokeStyle = 'rgba(199,125,255,0.07)';
    c.lineWidth = 1;
    c.beginPath();
    for (let x = 0; x <= ARENA.largura; x += 60) { c.moveTo(x, 0); c.lineTo(x, ARENA.altura); }
    for (let y = 0; y <= ARENA.altura; y += 60) { c.moveTo(0, y); c.lineTo(ARENA.largura, y); }
    c.stroke();

    // círculo central decorativo
    c.strokeStyle = 'rgba(255,209,102,0.08)';
    c.lineWidth = 2;
    c.beginPath();
    c.arc(ARENA.largura / 2, ARENA.altura / 2, 80 + Math.sin(this.tempo * 0.8) * 4, 0, Math.PI * 2);
    c.stroke();

    // obstáculos
    for (const o of OBSTACULOS) {
      c.fillStyle = '#241a3f';
      c.strokeStyle = '#4d3a8a';
      c.lineWidth = 2;
      c.beginPath();
      c.roundRect(o.x, o.y, o.w, o.h, 8);
      c.fill(); c.stroke();
    }

    // borda da arena
    c.strokeStyle = 'rgba(199,125,255,0.4)';
    c.lineWidth = 3;
    c.strokeRect(1.5, 1.5, ARENA.largura - 3, ARENA.altura - 3);

    // entidades
    for (const e of snap.entidades ?? []) this.desenharEntidade(e);

    // jogadores
    for (const j of snap.jogadores ?? []) this.desenharJogador(j, j.id === meuId);

    // partículas
    for (const p of this.particulas) {
      c.globalAlpha = Math.max(0, p.t / p.vida);
      c.fillStyle = p.cor;
      c.beginPath();
      c.arc(p.x, p.y, p.tam, 0, Math.PI * 2);
      c.fill();
    }
    c.globalAlpha = 1;

    // textos flutuantes
    c.textAlign = 'center';
    for (const t of this.textos) {
      c.globalAlpha = Math.min(1, t.t * 2);
      c.font = 'bold 17px "Segoe UI", sans-serif';
      c.fillStyle = t.cor;
      c.strokeStyle = 'rgba(0,0,0,0.7)';
      c.lineWidth = 3;
      c.strokeText(t.texto, t.x, t.y);
      c.fillText(t.texto, t.x, t.y);
    }
    c.globalAlpha = 1;
  }

  desenharEntidade(e) {
    const c = this.ctx;
    const cor = e.cor ?? ELEMENTOS[e.elemento]?.cor ?? '#c77dff';
    if (e.tipo === 'projetil') {
      c.shadowColor = cor; c.shadowBlur = 12;
      c.fillStyle = cor;
      c.beginPath(); c.arc(e.x, e.y, e.raio, 0, Math.PI * 2); c.fill();
      c.shadowBlur = 0;
      // cauda
      c.strokeStyle = cor; c.globalAlpha = 0.35; c.lineWidth = e.raio * 0.8;
      const vang = e.angulo ?? 0;
      c.beginPath();
      c.moveTo(e.x, e.y);
      c.lineTo(e.x - Math.cos(vang) * e.raio * 3.2, e.y - Math.sin(vang) * e.raio * 3.2);
      c.stroke();
      c.globalAlpha = 1;
    } else if (e.tipo === 'feixe') {
      c.shadowColor = cor; c.shadowBlur = 16;
      c.strokeStyle = cor;
      c.lineWidth = e.largura ?? 8;
      c.lineCap = 'round';
      c.globalAlpha = Math.min(1, (e.vidaRestante ?? 1) * 4);
      c.beginPath(); c.moveTo(e.x1, e.y1); c.lineTo(e.x2, e.y2); c.stroke();
      c.strokeStyle = '#ffffff'; c.lineWidth = (e.largura ?? 8) * 0.4;
      c.beginPath(); c.moveTo(e.x1, e.y1); c.lineTo(e.x2, e.y2); c.stroke();
      c.globalAlpha = 1; c.shadowBlur = 0;
    } else if (e.tipo === 'area') {
      c.strokeStyle = cor; c.shadowColor = cor; c.shadowBlur = 14;
      c.lineWidth = 4;
      c.globalAlpha = Math.max(0, e.t / 0.5);
      c.beginPath(); c.arc(e.x, e.y, e.raio * (1.25 - e.t), 0, Math.PI * 2); c.stroke();
      c.globalAlpha = Math.max(0, (e.t / 0.5) * 0.25);
      c.fillStyle = cor;
      c.beginPath(); c.arc(e.x, e.y, e.raio, 0, Math.PI * 2); c.fill();
      c.globalAlpha = 1; c.shadowBlur = 0;
    } else if (e.tipo === 'armadilha') {
      c.strokeStyle = cor; c.globalAlpha = e.armamento > 0 ? 0.35 : 0.85;
      c.lineWidth = 2.5;
      c.beginPath(); c.arc(e.x, e.y, e.raio, 0, Math.PI * 2); c.stroke();
      c.beginPath();
      for (let i = 0; i < 3; i++) {
        const a = this.tempo * 1.5 + (i * Math.PI * 2) / 3;
        c.moveTo(e.x, e.y);
        c.lineTo(e.x + Math.cos(a) * e.raio * 0.9, e.y + Math.sin(a) * e.raio * 0.9);
      }
      c.stroke();
      c.globalAlpha = 1;
    } else if (e.tipo === 'aura') {
      c.strokeStyle = cor; c.globalAlpha = 0.4;
      c.lineWidth = 3;
      c.setLineDash([10, 8]);
      c.lineDashOffset = -this.tempo * 40;
      c.beginPath(); c.arc(e.x, e.y, e.raio, 0, Math.PI * 2); c.stroke();
      c.setLineDash([]);
      c.globalAlpha = 1;
    }
  }

  desenharJogador(j, eu) {
    const c = this.ctx;
    const cor = COR_EQUIPA[j.equipa] ?? '#fff';
    // anel de estados
    if (j.estados?.length) {
      const cores = { queimadura: '#ff7a3c', molhado: '#3cc8ff', cego: '#dddddd', lento: '#d29a55', vento: '#a9f5c8' };
      j.estados.forEach((s, i) => {
        c.fillStyle = cores[s] ?? '#fff';
        c.beginPath();
        c.arc(j.x + (i - (j.estados.length - 1) / 2) * 11, j.y - 34, 3.4, 0, Math.PI * 2);
        c.fill();
      });
    }
    // barra de vida acima
    const larg = 46;
    c.fillStyle = 'rgba(0,0,0,0.55)';
    c.fillRect(j.x - larg / 2, j.y - 30, larg, 6);
    c.fillStyle = eu ? '#9dff8f' : '#ff8f9d';
    c.fillRect(j.x - larg / 2, j.y - 30, larg * Math.max(0, j.vida) / 100, 6);
    if (j.escudo > 0) {
      c.fillStyle = 'rgba(160,220,255,0.85)';
      c.fillRect(j.x - larg / 2, j.y - 30, larg * Math.min(1, j.escudo / 80), 6);
    }
    // corpo
    c.shadowColor = cor; c.shadowBlur = eu ? 16 : 10;
    c.fillStyle = cor;
    c.beginPath(); c.arc(j.x, j.y, 16, 0, Math.PI * 2); c.fill();
    c.shadowBlur = 0;
    c.fillStyle = '#0d0a1a';
    c.beginPath(); c.arc(j.x, j.y, 9, 0, Math.PI * 2); c.fill();
    // cunha de direção
    c.fillStyle = cor;
    c.save();
    c.translate(j.x, j.y);
    c.rotate(j.angulo ?? 0);
    c.beginPath();
    c.moveTo(24, 0); c.lineTo(12, -6); c.lineTo(12, 6);
    c.closePath(); c.fill();
    c.restore();
    // linha de mira (só do jogador humano)
    if (eu) {
      c.strokeStyle = 'rgba(255,209,102,0.28)';
      c.lineWidth = 1.5;
      c.setLineDash([5, 7]);
      c.beginPath();
      c.moveTo(j.x + Math.cos(j.angulo ?? 0) * 22, j.y + Math.sin(j.angulo ?? 0) * 22);
      c.lineTo(j.x + Math.cos(j.angulo ?? 0) * 380, j.y + Math.sin(j.angulo ?? 0) * 380);
      c.stroke();
      c.setLineDash([]);
    }
    // nome
    c.font = '600 13px "Segoe UI", sans-serif';
    c.textAlign = 'center';
    c.fillStyle = 'rgba(232,226,255,0.9)';
    c.fillText(j.nome ?? '', j.x, j.y - 38);
  }
}
