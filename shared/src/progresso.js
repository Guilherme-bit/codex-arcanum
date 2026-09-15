// Progressão: XP, níveis e desbloqueio de componentes mágicos.
export const XP_POR_NIVEL = 100;

export const COMPONENTES_NIVEL = {
  projetil: 1,
  dash: 2,
  feixe: 3,
  area: 4,
  armadilha: 5,
  teleporte: 6,
  escudo: 7,
  aura: 8,
};

export const RECOMPENSAS_XP = { licao: 50, vitoria: 30, derrota: 10, treino: 8 };

export function nivelDe(xp) {
  return Math.min(20, Math.floor(Math.max(0, xp) / XP_POR_NIVEL) + 1);
}

export function xpDentroDoNivel(xp) {
  return Math.max(0, xp) % XP_POR_NIVEL;
}

export function componentesDesbloqueados(nivel) {
  return Object.entries(COMPONENTES_NIVEL)
    .filter(([, n]) => n <= nivel)
    .map(([c]) => c);
}

export function proximosDesbloqueios(nivel) {
  return Object.entries(COMPONENTES_NIVEL)
    .filter(([, n]) => n > nivel)
    .map(([c, n]) => ({ componente: c, nivel: n }));
}
