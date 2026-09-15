// Gerador pseudoaleatório determinístico (mulberry32).
// Toda a aleatoriedade da simulação passa por aqui — é o que garante
// replays e sincronização determinística entre cliente e servidor.

export function criarRng(semente) {
  let a = semente >>> 0;
  return function aleatorio() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
