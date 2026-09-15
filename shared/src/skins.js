// Skins dos magos — cosméticas, desbloqueadas por nível.
// Cada forma é desenhada pelo renderizador (client/src/render/renderizador.js).
export const SKINS = [
  { id: 'aprendiz',   nome: 'Aprendiz',     forma: 'orbe',    cor1: '#ffd166', cor2: '#fff3c4', nivel: 1, descricao: 'O primeiro orbe de todos os magos.' },
  { id: 'safira',     nome: 'Safira',       forma: 'orbe',    cor1: '#4ea8ff', cor2: '#c8ecff', nivel: 2, descricao: 'Fria como o fundo do lago arcano.' },
  { id: 'jade',       nome: 'Jade',         forma: 'cristal', cor1: '#7bffb2', cor2: '#e8fff2', nivel: 3, descricao: 'Cristal que cresce onde há paciência.' },
  { id: 'rubi',       nome: 'Rubi',         forma: 'cristal', cor1: '#ff5c7a', cor2: '#ffd9e0', nivel: 4, descricao: 'Forjado na pressa dos duelos.' },
  { id: 'observador', nome: 'Observador',   forma: 'olho',    cor1: '#c77dff', cor2: '#f2e6ff', nivel: 5, descricao: 'Vê a trajetória antes de o projétil existir.' },
  { id: 'cometa',     nome: 'Cometa',       forma: 'cometa',  cor1: '#7cc4ff', cor2: '#ffffff', nivel: 6, descricao: 'Só para quem nunca para de se mexer.' },
  { id: 'hexagrama',  nome: 'Hexagrama',    forma: 'hexa',    cor1: '#ffb14e', cor2: '#ffe6b8', nivel: 7, descricao: 'Seis lados, seis encantamentos.' },
  { id: 'lenda',      nome: 'Lenda Arcana', forma: 'estrela', cor1: '#ffe98a', cor2: '#ffffff', nivel: 8, descricao: 'Reservada a quem domina os oito capítulos.' },
];

export function skinPorId(id) {
  return SKINS.find((s) => s.id === id) ?? SKINS[0];
}

// Skins desbloqueadas dado um nível.
export function skinsDesbloqueadas(nivel) {
  return SKINS.filter((s) => s.nivel <= nivel);
}
