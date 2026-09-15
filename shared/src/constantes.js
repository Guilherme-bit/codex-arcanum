// Constantes partilhadas da simulação — usadas tanto pelo cliente (treino offline)
// como pelo servidor autoritativo (multiplayer). Alterar aqui altera o jogo todo.

export const SIM_HZ = 60;                  // ticks de simulação por segundo
export const DT = 1 / SIM_HZ;              // duração de um tick
export const FOTO_TICKS = 3;               // snapshot a cada 3 ticks → 20 Hz (multiplayer)

export const ARENA = { largura: 960, altura: 600 };

// Obstáculos da arena (retângulos). Simétricos para justiça entre os dois lados.
export const OBSTACULOS = [
  { x: 430, y: 250, w: 100, h: 100 },  // bloco central
  { x: 170, y: 100, w: 46, h: 150 },
  { x: 744, y: 100, w: 46, h: 150 },
  { x: 170, y: 350, w: 46, h: 150 },
  { x: 744, y: 350, w: 46, h: 150 },
  { x: 390, y: 40, w: 180, h: 34 },
  { x: 390, y: 526, w: 180, h: 34 },
];

export const PONTOS_NASCIMENTO = [ { x: 110, y: 300 }, { x: 850, y: 300 } ];

export const JOGADOR = {
  raio: 16,
  vidaMax: 100,
  manaMax: 100,
  regenMana: 9,        // mana por segundo
  velocidade: 185,     // unidades por segundo
  dashVel: 640,
  dashDur: 0.13,
  dashCd: 3.5,
  escudoMax: 80,
};

export const RODADA = {
  duracao: 90,         // segundos; depois disso → morte súbita
  roundsParaVencer: 2, // melhor de 3
};

// Orçamento de execução da sandbox (por invocação de hook)
export const PASSOS = {
  aoLancar: 5000,
  aCadaTick: 900,
  evento: 900,
};

export const LIMITES = {
  entidadesPorLancamento: 40,
  entidadesTotais: 220,
  duracaoAtivaPadrao: 3,   // segundos durante os quais aCadaTick corre após o lançamento
};

export const ELEMENTOS = {
  fogo:   { cor: '#ff7a3c', nome: 'Fogo' },
  agua:   { cor: '#3cc8ff', nome: 'Água' },
  terra:  { cor: '#d29a55', nome: 'Terra' },
  ar:     { cor: '#a9f5c8', nome: 'Ar' },
  arcano: { cor: '#c77dff', nome: 'Arcano' },
};

// Sinergias elementais: quando um estado é aplicado a um alvo que já tem outro.
export const SINERGIAS = {
  // fogo sobre alvo molhado → vapor que cega
  'queimadura+molhado': { vira: 'cego', danoExtra: 4, texto: 'VAPOR!' },
  // fogo sobre alvo com marca de vento → explosão ampliada
  'queimadura+vento':   { danoExtra: 6, texto: 'EXPLOSÃO!' },
  // água extingue queimadura e cura ligeiramente
  'molhado+queimadura': { extingue: true, cura: 3, texto: 'EXTINGUIDO' },
};

export const LIGAS = [
  { min: 0,    nome: 'Aprendiz' },
  { min: 1100, nome: 'Mago' },
  { min: 1300, nome: 'Arquimago' },
  { min: 1500, nome: 'Lenda Arcana' },
];

export function ligaDe(rating) {
  let l = LIGAS[0];
  for (const x of LIGAS) if (rating >= x.min) l = x;
  return l.nome;
}

// Orçamento de energia arcana do loadout (soma das complexidades dos feitiços equipados)
export const ENERGIA_ARCANA_MAX = 100;

// Distância que define "inimigo perto" para os hooks quandoInimigoPerto/Longe
export const DISTANCIA_PERTO = 220;
