// Renderizador Canvas 2D da arena: fundos por mapa, obstáculos, portais, orbes,
// skins (formas de personagem), partículas e juice.
import { ARENA, ELEMENTOS, mapaPorId, skinPorId } from '@codex/shared';

const COR_EQUIPA = ['#ffd166', '#ff5c7a']; // contorno: eu / adversário

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
        case 'portal': this.jato(ev.x, ev.y, ev.cor ?? '#7cc4ff', 10, 150); break;
        case 'orbe':
          this.jato(ev.x, ev.y, ev.cor, 14, 200);
          if (ev.texto) this.textos.push({ x: ev.x, y: ev.y - 14, texto: ev.texto, cor: ev.cor, t: 0.9, vy: -40 });
          break;
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

    const mapa = mapaPorId(snap.mapaId ?? 'academia');

    // fundo da arena (tinta por mapa)
    const tintes = {
      academia: ['#1d1440', '#0b0718'],
      santuario: ['#0f2438', '#060e1a'],
    };
    const [tinte1, tinte2] = tintes[mapa.id] ?? tintes.academia;
    const g = c.createRadialGradient(ARENA.largura / 2, ARENA.altura / 2, 60, ARENA.largura / 2, ARENA.altura / 2, 620);
    g.addColorStop(0, tinte1);
    g.addColorStop(1, tinte2);
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

    // portais (pares ligados)
    for (const par of mapa.portais ?? []) {
      for (const p of [par.a, par.b]) {
        c.save();
        c.translate(p.x, p.y);
        c.rotate(this.tempo * 1.4);
        c.strokeStyle = '#7cc4ff';
        c.shadowColor = '#7cc4ff';
        c.shadowBlur = 12;
        c.lineWidth = 2.5;
        c.setLineDash([9, 7]);
        c.beginPath(); c.arc(0, 0, 22, 0, Math.PI * 2); c.stroke();
        c.setLineDash([]);
        c.beginPath(); c.arc(0, 0, 12, 0, Math.PI * 2); c.stroke();
        c.restore();
        c.shadowBlur = 0;
      }
    }

    // obstáculos
    for (const o of mapa.obstaculos) {
      c.fillStyle = mapa.id === 'santuario' ? '#13293d' : '#241a3f';
      c.strokeStyle = mapa.id === 'santuario' ? '#3a6a8a' : '#4d3a8a';
      c.lineWidth = 2;
      c.beginPath();
      c.roundRect(o.x, o.y, o.w, o.h, 8);
      c.fill(); c.stroke();
    }

    // orbes de mana/vida
    for (const o of snap.orbes ?? []) {
      const cor = o.tipo === 'mana' ? '#4ea8ff' : '#7bffb2';
      const bob = Math.sin(this.tempo * 3 + o.x) * 3;
      c.shadowColor = cor; c.shadowBlur = 16;
      c.fillStyle = cor;
      c.beginPath();
      c.moveTo(o.x, o.y - 9 + bob);
      c.lineTo(o.x + 7, o.y + bob);
      c.lineTo(o.x, o.y + 9 + bob);
      c.lineTo(o.x - 7, o.y + bob);
      c.closePath(); c.fill();
      c.shadowBlur = 0;
      c.fillStyle = 'rgba(255,255,255,0.85)';
      c.beginPath(); c.arc(o.x - 2, o.y - 3 + bob, 2, 0, Math.PI * 2); c.fill();
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
      // Tinta de Treino: runa dourada a orbitar (feitiço aprendido com ajuda)
      if (e.runa) {
        c.save();
        c.translate(e.x, e.y);
        c.rotate(this.tempo * 5);
        c.strokeStyle = '#ffd166';
        c.globalAlpha = 0.9;
        c.lineWidth = 1.4;
        c.setLineDash([3, 4]);
        c.beginPath(); c.arc(0, 0, e.raio + 5, 0, Math.PI * 2); c.stroke();
        c.setLineDash([]);
        c.restore();
        c.globalAlpha = 1;
      }
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
    const skin = skinPorId(j.skin);
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
    const ang = j.angulo ?? 0;
    c.shadowColor = skin.cor1;
    c.shadowBlur = eu ? 18 : 12;

    // corpo por forma de skin
    if (skin.forma === 'cristal') {
      c.fillStyle = skin.cor1;
      c.save(); c.translate(j.x, j.y); c.rotate(Math.PI / 4);
      c.beginPath(); c.rect(-12, -12, 24, 24); c.fill();
      c.restore();
      c.fillStyle = skin.cor2;
      c.save(); c.translate(j.x, j.y); c.rotate(Math.PI / 4);
      c.beginPath(); c.rect(-6, -6, 12, 12); c.fill();
      c.restore();
    } else if (skin.forma === 'olho') {
      c.fillStyle = skin.cor1;
      c.beginPath(); c.arc(j.x, j.y, 16, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#0d0a1a';
      c.beginPath(); c.arc(j.x + Math.cos(ang) * 5, j.y + Math.sin(ang) * 5, 8, 0, Math.PI * 2); c.fill();
      c.fillStyle = skin.cor2;
      c.beginPath(); c.arc(j.x + Math.cos(ang) * 7, j.y + Math.sin(ang) * 7, 3.4, 0, Math.PI * 2); c.fill();
    } else if (skin.forma === 'cometa') {
      // rastro em gradiente oposto à mira
      const rg = c.createLinearGradient(j.x, j.y, j.x - Math.cos(ang) * 40, j.y - Math.sin(ang) * 40);
      rg.addColorStop(0, skin.cor2);
      rg.addColorStop(1, 'rgba(124,196,255,0)');
      c.fillStyle = rg;
      c.beginPath(); c.arc(j.x - Math.cos(ang) * 18, j.y - Math.sin(ang) * 18, 12, 0, Math.PI * 2); c.fill();
      c.fillStyle = skin.cor1;
      c.beginPath(); c.arc(j.x, j.y, 13, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#0d0a1a';
      c.beginPath(); c.arc(j.x, j.y, 6, 0, Math.PI * 2); c.fill();
    } else if (skin.forma === 'hexa') {
      c.fillStyle = skin.cor1;
      c.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = ang + (i / 6) * Math.PI * 2;
        const px = j.x + Math.cos(a) * 16, py = j.y + Math.sin(a) * 16;
        i === 0 ? c.moveTo(px, py) : c.lineTo(px, py);
      }
      c.closePath(); c.fill();
      c.fillStyle = skin.cor2;
      c.beginPath(); c.arc(j.x, j.y, 7, 0, Math.PI * 2); c.fill();
    } else if (skin.forma === 'estrela') {
      c.fillStyle = skin.cor1;
      c.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? 18 : 8;
        const a = -Math.PI / 2 + ang * 0 + (i / 10) * Math.PI * 2 + this.tempo * 0.6;
        const px = j.x + Math.cos(a) * r, py = j.y + Math.sin(a) * r;
        i === 0 ? c.moveTo(px, py) : c.lineTo(px, py);
      }
      c.closePath(); c.fill();
      c.fillStyle = '#0d0a1a';
      c.beginPath(); c.arc(j.x, j.y, 5.5, 0, Math.PI * 2); c.fill();
    } else {
      // 'orbe' (predefinido): anel com núcleo
      c.fillStyle = skin.cor1;
      c.beginPath(); c.arc(j.x, j.y, 16, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#0d0a1a';
      c.beginPath(); c.arc(j.x, j.y, 9, 0, Math.PI * 2); c.fill();
      c.fillStyle = skin.cor2;
      c.beginPath(); c.arc(j.x, j.y, 4.5, 0, Math.PI * 2); c.fill();
    }
    c.shadowBlur = 0;

    // contorno da equipa (identifica tu vs adversário)
    c.strokeStyle = cor;
    c.lineWidth = 2;
    c.beginPath(); c.arc(j.x, j.y, 19, 0, Math.PI * 2); c.stroke();

    // cunha de direção
    c.fillStyle = cor;
    c.save();
    c.translate(j.x, j.y);
    c.rotate(ang);
    c.beginPath();
    c.moveTo(26, 0); c.lineTo(14, -6); c.lineTo(14, 6);
    c.closePath(); c.fill();
    c.restore();
    // linha de mira (só do jogador humano)
    if (eu) {
      c.strokeStyle = 'rgba(255,209,102,0.28)';
      c.lineWidth = 1.5;
      c.setLineDash([5, 7]);
      c.beginPath();
      c.moveTo(j.x + Math.cos(ang) * 22, j.y + Math.sin(ang) * 22);
      c.lineTo(j.x + Math.cos(ang) * 380, j.y + Math.sin(ang) * 380);
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
