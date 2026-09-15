// Perfil do jogador — guardado em localStorage (cliente).
// O rating ranqueado tem fonte de verdade no servidor; aqui é só espelho.
import { compilarFeitico, obterClassicos, nivelDe, xpDentroDoNivel, XP_POR_NIVEL, ENERGIA_ARCANA_MAX } from '@codex/shared';

const CHAVE = 'codex-arcanum-perfil-v1';

function padrao() {
  return {
    nome: '',
    xp: 0,
    licoes: [],
    feiticos: [],
    loadout: ['classico-1', 'classico-2', 'classico-3', 'classico-4', 'classico-5', 'classico-6'],
    rating: 1000,
    stats: { v: 0, d: 0 },
  };
}

let dados = carregar();

function carregar() {
  try {
    const d = JSON.parse(localStorage.getItem(CHAVE));
    if (d && typeof d === 'object') return { ...padrao(), ...d };
  } catch { /* perfil danificado → começa de novo */ }
  return padrao();
}

function guardar() {
  try { localStorage.setItem(CHAVE, JSON.stringify(dados)); } catch { /* modo privado */ }
}

export const perfil = {
  get dados() { return dados; },
  get nivel() { return nivelDe(dados.xp); },
  get xpNoNivel() { return xpDentroDoNivel(dados.xp); },
  get xpPorNivel() { return XP_POR_NIVEL; },

  guardarTudo: guardar,

  definirNome(nome) { dados.nome = String(nome).slice(0, 18); guardar(); },

  adicionarXP(n) {
    const antes = this.nivel;
    dados.xp += n;
    guardar();
    return this.nivel > antes ? this.nivel : 0; // devolve novo nível se subiu
  },

  concluirLicao(id) {
    if (!dados.licoes.includes(id)) { dados.licoes.push(id); guardar(); }
  },
  licaoFeita: (id) => dados.licoes.includes(id),

  // ── feitiços pessoais ───────────────────────────────────────
  guardarFeitico(codigo) {
    const r = compilarFeitico(codigo);
    if (!r.ok) return { ok: false, erros: r.erros };
    const existente = dados.feiticos.find((f) => f.codigo === codigo);
    if (existente) { existente.nome = r.feitico.nome; guardar(); return { ok: true, id: existente.id }; }
    const id = 'f' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
    dados.feiticos.push({ id, nome: r.feitico.nome, codigo, criado: Date.now() });
    guardar();
    return { ok: true, id };
  },

  apagarFeitico(id) {
    dados.feiticos = dados.feiticos.filter((f) => f.id !== id);
    dados.loadout = dados.loadout.map((s) => (s === id ? null : s));
    guardar();
  },

  // Devolve o feitiço (com código) por id — clássicos incluídos.
  feiticoPorId(id) {
    if (!id) return null;
    if (id.startsWith('classico-')) return obterClassicos().find((c) => c.id === id) ?? null;
    return dados.feiticos.find((f) => f.id === id) ?? null;
  },

  equipar(slot, idFeitico) {
    if (slot >= 0 && slot < 6) { dados.loadout[slot] = idFeitico; guardar(); }
  },

  // Compila o loadout atual → array de 6 (feitiços compilados ou null).
  loadoutCompilado() {
    return dados.loadout.map((id) => {
      const f = this.feiticoPorId(id);
      if (!f) return null;
      if (f.hooks) return { ...f }; // já é compilado (clássicos em cache)
      const r = compilarFeitico(f.codigo);
      return r.ok ? r.feitico : null;
    });
  },

  energiaLoadout() {
    return this.loadoutCompilado().filter(Boolean).reduce((s, f) => s + f.complexidade, 0);
  },
  get energiaMax() { return ENERGIA_ARCANA_MAX; },

  // Códigos de feitiços para enviar ao servidor (validação autoritativa).
  codigosLoadout() {
    return dados.loadout.map((id) => {
      const f = this.feiticoPorId(id);
      if (!f) return null;
      return f.codigo ?? null; // clássicos têm .codigo do compilador
    });
  },

  registarDuelo(venceu, ratingServidor) {
    if (venceu) dados.stats.v++; else dados.stats.d++;
    if (typeof ratingServidor === 'number') dados.rating = ratingServidor;
    guardar();
  },
};
