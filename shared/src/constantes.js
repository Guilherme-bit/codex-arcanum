// Constantes partilhadas da simulação — usadas tanto pelo cliente (treino offline)
// como pelo servidor autoritativo (multiplayer). Alterar aqui altera o jogo todo.

export const SIM_HZ = 60;                  // ticks de simulação por segundo
export const DT = 1 / SIM_HZ;              // duração de um tick
export const FOTO_TICKS = 3;               // snapshot a cada 3 ticks → 20 Hz (multiplayer)

export const ARENA = { largura: 960, altura: 600 };

// Teclas dos slots (ordem = slot 1..6) — ergonómicas perto de WASD.
export const TECLAS_SLOTS = ['Q', 'E', 'R', 'F', 'C', 'V'];

// Tinta de Treino: feitiços aprendidos com ajuda do Tomo causam menos dano
// até serem "purificados" com vitórias em duelo (ver perfil.js / servidor).
export const POTENCIA_RUNA = 0.75;
export const VITORIAS_PARA_PURIFICAR = 2;

// ── Mapas ────────────────────────────────────────────────────────────────────
// Cada mapa: obstáculos, pontos de nascimento, portais ligados (a↔b) e orbes
// que nascem em posições fixas de forma determinística (ciclo de segundos).
const OBSTACULOS_ACADEMIA = [
  { x: 430, y: 250, w: 100, h: 100 },  // bloco central
  { x: 170, y: 100, w: 46, h: 150 },
  { x: 744, y: 100, w: 46, h: 150 },
  { x: 170, y: 350, w: 46, h: 150 },
  { x: 744, y: 350, w: 46, h: 150 },
  { x: 390, y: 40, w: 180, h: 34 },
  { x: 390, y: 526, w: 180, h: 34 },
];

const OBSTACULOS_SANTUARIO = [
  { x: 300, y: 140, w: 70, h: 70 },
  { x: 590, y: 140, w: 70, h: 70 },
  { x: 300, y: 390, w: 70, h: 70 },
  { x: 590, y: 390, w: 70, h: 70 },
  { x: 430, y: 265, w: 100, h: 70 },
  { x: 50, y: 250, w: 34, h: 100 },
  { x: 876, y: 250, w: 34, h: 100 },
];

export const MAPAS = [
  {
    id: 'academia',
    nome: 'Pátio da Academia',
    obstaculos: OBSTACULOS_ACADEMIA,
    nascimento: [ { x: 110, y: 300 }, { x: 850, y: 300 } ],
    portais: [ { a: { x: 480, y: 90 }, b: { x: 480, y: 510 } } ],
    orbes: [
      { x: 130, y: 110, tipo: 'mana', ciclo: 24, desvio: 4 },
      { x: 830, y: 490, tipo: 'vida', ciclo: 24, desvio: 12 },
      { x: 480, y: 300, tipo: 'mana', ciclo: 32, desvio: 0 },
    ],
  },
  {
    id: 'santuario',
    nome: 'Santuário das Runas',
    obstaculos: OBSTACULOS_SANTUARIO,
    nascimento: [ { x: 110, y: 300 }, { x: 850, y: 300 } ],
    portais: [
      { a: { x: 67, y: 160 }, b: { x: 893, y: 440 } },
      { a: { x: 480, y: 60 }, b: { x: 480, y: 540 } },
    ],
    orbes: [
      { x: 110, y: 70, tipo: 'vida', ciclo: 26, desvio: 2 },
      { x: 850, y: 530, tipo: 'vida', ciclo: 26, desvio: 14 },
      { x: 110, y: 530, tipo: 'mana', ciclo: 20, desvio: 6 },
      { x: 850, y: 70, tipo: 'mana', ciclo: 20, desvio: 16 },
      { x: 480, y: 130, tipo: 'mana', ciclo: 34, desvio: 0 },
    ],
  },
];

export function mapaPorId(id) {
  return MAPAS.find((m) => m.id === id) ?? MAPAS[0];
}

// Compatibilidade: obstáculos/nascimento do mapa padrão.
export const OBSTACULOS = OBSTACULOS_ACADEMIA;
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
