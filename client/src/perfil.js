// Perfil do jogador — guardado em localStorage (cliente).
// O rating ranqueado tem fonte de verdade no servidor; aqui é só espelho.
import {
  compilarFeitico, obterClassicos, nivelDe, xpDentroDoNivel, XP_POR_NIVEL,
  ENERGIA_ARCANA_MAX, POTENCIA_RUNA, VITORIAS_PARA_PURIFICAR, skinPorId,
} from '@codex/shared';

const CHAVE = 'codex-arcanum-perfil-v1';

function padrao() {
  return {
    nome: '',
    xp: 0,
    licoes: [],
    dicasUsadas: {},   // { [idLicao]: true } — marca a Tinta de Treino
    feiticos: [],      // { id, nome, codigo, criado, tinta?: { vitorias: 0 } }
    loadout: ['classico-1', 'classico-2', 'classico-3', 'classico-4', 'classico-5', 'classico-6'],
    skin: 'aprendiz',
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
  definirSkin(id) {
    const s = skinPorId(id);
    if (s.nivel <= this.nivel) { dados.skin = s.id; guardar(); }
  },
  get skin() { return dados.skin; },

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

  // Tinta de Treino: consultar a dica marca a lição — feitiços guardados dela
  // nascem com tinta (−25% de dano) até serem purificados com vitórias.
  marcarDica(id) { dados.dicasUsadas[id] = true; guardar(); },
  dicaUsada: (id) => !!dados.dicasUsadas[id],

  // ── feitiços pessoais ───────────────────────────────────────
  // opcoes: { tinta: true } → nasce com Tinta de Treino
  guardarFeitico(codigo, opcoes = {}) {
    const r = compilarFeitico(codigo);
    if (!r.ok) return { ok: false, erros: r.erros };
    const existente = dados.feiticos.find((f) => f.codigo === codigo);
    if (existente) {
      existente.nome = r.feitico.nome;
      if (opcoes.tinta && !existente.tinta) existente.tinta = { vitorias: 0 };
      guardar();
      return { ok: true, id: existente.id };
    }
    const id = 'f' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
    dados.feiticos.push({
      id, nome: r.feitico.nome, codigo, criado: Date.now(),
      tinta: opcoes.tinta ? { vitorias: 0 } : undefined,
    });
    guardar();
    return { ok: true, id };
  },

  // Vitória em duelo: a tinta desbota. Devolve lista de feitiços purificados.
  purificarTintas(idsEquipados) {
    const purificados = [];
    for (const id of idsEquipados) {
      const f = dados.feiticos.find((x) => x.id === id);
      if (!f?.tinta) continue;
      f.tinta.vitorias++;
      if (f.tinta.vitorias >= VITORIAS_PARA_PURIFICAR) {
        purificados.push(f.nome);
        f.tinta = undefined;
      }
    }
    guardar();
    return purificados;
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

  // Compila o loadout atual → array de 6 (feitiços compilados com potencia ou null).
  loadoutCompilado() {
    return dados.loadout.map((id) => {
      const f = this.feiticoPorId(id);
      if (!f) return null;
      let compilado;
      if (f.hooks) compilado = { ...f }; // já é compilado (clássicos em cache)
      else {
        const r = compilarFeitico(f.codigo);
        if (!r.ok) return null;
        compilado = r.feitico;
      }
      if (f.tinta) compilado.potencia = POTENCIA_RUNA;
      return compilado;
    });
  },

  energiaLoadout() {
    return this.loadoutCompilado().filter(Boolean).reduce((s, f) => s + f.complexidade, 0);
  },
  get energiaMax() { return ENERGIA_ARCANA_MAX; },

  // Códigos para o servidor (validação autoritativa), com a Tinta declarada.
  codigosLoadout() {
    return dados.loadout.map((id) => {
      const f = this.feiticoPorId(id);
      if (!f) return null;
      const codigo = f.codigo ?? null;
      if (!codigo) return null;
      return f.tinta ? { codigo, potencia: POTENCIA_RUNA } : { codigo, potencia: 1 };
    });
  },

  idsLoadoutPessoais() {
    return dados.loadout.filter((id) => id && !id.startsWith('classico-'));
  },

  registarDuelo(venceu, ratingServidor) {
    if (venceu) dados.stats.v++; else dados.stats.d++;
    if (typeof ratingServidor === 'number') dados.rating = ratingServidor;
    guardar();
  },
};
