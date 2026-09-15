// Construtores dos objetos "ctx" e "alvo" que os feitiços dos jogadores recebem.
// Toda a interação do código do jogador com o mundo passa por aqui — é a API de magia.
import { ErroFeitico } from '../sandbox/compilador.js';

export function construirCtx(partida, jog, feitico, contagem) {
  return {
    // Posição do lançador {x, y}
    pos: () => ({ x: Math.round(jog.x), y: Math.round(jog.y) }),
    // Ponto alvo do cursor {x, y}
    mira: () => partida.alvoMira(jog),
    // Ângulo para onde o rato aponta (radianos)
    anguloMira: () => jog.anguloMira,
    vida: () => Math.max(0, Math.round(jog.vida)),
    mana: () => Math.round(jog.mana),
    tempo: () => Math.max(0, Math.round(partida.tRestante)),
    inimigo: () => {
      const e = partida.inimigoDe(jog.id);
      return e
        ? { x: Math.round(e.x), y: Math.round(e.y), vx: Math.round(e.vx || 0), vy: Math.round(e.vy || 0), vida: Math.max(0, Math.round(e.vida)), escudo: Math.round(e.escudo) }
        : null;
    },
    distanciaInimigo: () => {
      const e = partida.inimigoDe(jog.id);
      return e ? Math.hypot(e.x - jog.x, e.y - jog.y) : Infinity;
    },
    anguloParaInimigo: () => {
      const e = partida.inimigoDe(jog.id);
      return e ? Math.atan2(e.y - jog.y, e.x - jog.x) : jog.anguloMira;
    },
    // Componente principal: invocar({ tipo, ...opções, aoAcertar(alvo) })
    invocar: (op) => partida.invocar(jog, feitico, contagem, op),
    dash: (op = {}) => partida.dashMagico(jog, op),
    teleporte: (op = {}) => partida.teleporteMagico(jog, op),
    escudo: (op = {}) => partida.criarEscudo(jog, op),
    aura: (op = {}) => partida.criarAura(jog, op),
    // Aleatório determinístico da partida (0..1)
    aleatorio: () => partida.rng(),
    // Depuração: escrever("...") aparece na consola do jogo
    escrever: (...a) => partida.registarLog(jog, a),
  };
}

// Objeto "alvo" entregue ao hook aoAcertar(alvo) de um projétil.
export function alvoAplicavel(partida, alvo) {
  return {
    x: Math.round(alvo.x),
    y: Math.round(alvo.y),
    vida: () => Math.max(0, Math.round(alvo.vida)),
    // alvo.aplicar("queimadura", { dps: 2, duracao: 3 })
    aplicar: (estado, op = {}) => {
      if (typeof estado !== 'string') throw new ErroFeitico('alvo.aplicar espera um nome de estado, ex.: "queimadura".');
      partida.aplicarEstado(alvo, {
        estado,
        dps: Number(op.dps) || 2,
        duracao: Number(op.duracao) || 3,
        forca: Number(op.forca) || 120,
      }, undefined);
    },
    empurrar: (ang, forca = 120) => partida.empurrar(alvo, ang, forca),
  };
}
