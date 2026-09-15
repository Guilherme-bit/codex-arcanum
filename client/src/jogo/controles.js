// Controlos do jogador — pensados para mãos reais:
//   movimento: WASD · mira: rato
//   feitiços: Q E R F C V (1–6 continuam a funcionar como alternativa)
//   roda do rato: escolhe o slot · clique esquerdo: lança o slot escolhido
//   espaço: dash
export const TECLAS_SLOTS = ['Q', 'E', 'R', 'F', 'C', 'V'];

const MAPA_TECLAS = { q: 0, e: 1, r: 2, f: 3, c: 4, v: 5, '1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5 };

export class Controlos {
  constructor() {
    this.teclas = {};
    this.bitsLancar = 0;
    this.dashPend = false;
    this.miraPx = { x: 0, y: 0 };
    this.slotSelecionado = 0;
    this._transformar = null;
    this.ativo = true;

    this._kd = (e) => {
      if (!this.ativo) return;
      const k = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', ' ', '1', '2', '3', '4', '5', '6', 'q', 'e', 'r', 'f', 'c', 'v'].includes(k)) e.preventDefault();
      const slot = MAPA_TECLAS[k];
      if (slot !== undefined && !e.repeat) this.bitsLancar |= 1 << slot;
      if (k === ' ' && !e.repeat) this.dashPend = true;
      this.teclas[k] = true;
    };
    this._ku = (e) => { this.teclas[e.key.toLowerCase()] = false; };
    this._mm = (e) => {
      if (!this.ativo) return;
      const r = this.canvas.getBoundingClientRect();
      this.miraPx = { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    this._md = () => { if (this.ativo) this.bitsLancar |= 1 << this.slotSelecionado; };
    this._roda = (e) => {
      if (!this.ativo) return;
      e.preventDefault();
      const dir = e.deltaY > 0 ? 1 : -1;
      this.slotSelecionado = (this.slotSelecionado + dir + 6) % 6;
    };

    window.addEventListener('keydown', this._kd);
    window.addEventListener('keyup', this._ku);
    window.addEventListener('mousedown', this._md);
    window.addEventListener('wheel', this._roda, { passive: false });
  }

  ligarRato(canvas, transformar) {
    this.canvas = canvas;
    this._transformar = transformar;
    canvas.addEventListener('mousemove', this._mm);
  }

  // Devolve o input do tick e limpa os "recém-pressionados".
  consumir() {
    const m = this._transformar ? this._transformar(this.miraPx.x, this.miraPx.y) : { x: 0, y: 0 };
    const input = {
      cima: !!this.teclas['w'] || !!this.teclas['arrowup'],
      baixo: !!this.teclas['s'] || !!this.teclas['arrowdown'],
      esq: !!this.teclas['a'] || !!this.teclas['arrowleft'],
      dir: !!this.teclas['d'] || !!this.teclas['arrowright'],
      miraX: m.x, miraY: m.y,
      lancar: this.bitsLancar,
      dash: this.dashPend,
      slotSelecionado: this.slotSelecionado,
    };
    this.bitsLancar = 0;
    this.dashPend = false;
    return input;
  }

  destruir() {
    this.ativo = false;
    window.removeEventListener('keydown', this._kd);
    window.removeEventListener('keyup', this._ku);
    window.removeEventListener('mousedown', this._md);
    window.removeEventListener('wheel', this._roda);
    if (this.canvas) this.canvas.removeEventListener('mousemove', this._mm);
  }
}
