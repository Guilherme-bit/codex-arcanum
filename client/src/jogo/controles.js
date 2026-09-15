// Controlos do jogador: WASD + rato + teclas 1–6 + espaço (dash).
// As teclas de lançamento produzem "bits" de just-pressed consumidos pela simulação.
export class Controlos {
  constructor() {
    this.teclas = {};
    this.bitsLancar = 0;
    this.dashPend = false;
    this.miraPx = { x: 0, y: 0 };
    this._transformar = null;
    this.ativo = true;

    this._kd = (e) => {
      if (!this.ativo) return;
      const k = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', ' ', '1', '2', '3', '4', '5', '6'].includes(k)) e.preventDefault();
      if (k >= '1' && k <= '6' && !e.repeat) this.bitsLancar |= 1 << (k.charCodeAt(0) - 49);
      if (k === ' ' && !e.repeat) this.dashPend = true;
      this.teclas[k] = true;
    };
    this._ku = (e) => { this.teclas[e.key.toLowerCase()] = false; };
    this._mm = (e) => {
      if (!this.ativo) return;
      const r = this.canvas.getBoundingClientRect();
      this.miraPx = { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    this._md = () => { if (this.ativo) this.bitsLancar |= 1; }; // clique esquerdo = slot 1

    window.addEventListener('keydown', this._kd);
    window.addEventListener('keyup', this._ku);
    window.addEventListener('mousedown', this._md);
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
    if (this.canvas) this.canvas.removeEventListener('mousemove', this._mm);
  }
}
