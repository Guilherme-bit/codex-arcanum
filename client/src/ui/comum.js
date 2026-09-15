// Componentes de UI partilhados: barra de topo e navegação.
import { perfil } from '../perfil.js';
import { som } from '../audio.js';

export function navegar(hash) {
  som('ui');
  if (location.hash === hash) {
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    location.hash = hash;
  }
}

export function criarBarraTopo(secaoAtiva) {
  const barra = document.createElement('div');
  barra.className = 'barra-topo';
  const secoes = [
    ['#/inicio', 'Início'],
    ['#/academia', 'Academia'],
    ['#/grimorio', 'Grimório'],
    ['#/tomo', 'Tomo'],
    ['#/poligono', 'Polígono'],
    ['#/duelo', 'Duelo'],
    ['#/perfil', 'Perfil'],
  ];
  barra.innerHTML = `
    <div class="marca"><img src="/icon.svg" alt="Codex Arcanum"/>CODEX ARCANUM</div>
    ${secoes.map(([h, t]) => `<button class="mini ${location.hash.startsWith(h) ? 'primario' : ''}" data-nav="${h}">${t}</button>`).join('')}
    <div class="espaco"></div>
    <div class="pastilha-nivel">
      <span>${perfil.dados.nome || 'Mago sem nome'}</span>
      <span>Nível ${perfil.nivel}</span>
      <div class="barra-xp" title="${perfil.xpNoNivel}/${perfil.xpPorNivel} XP"><div style="width:${(perfil.xpNoNivel / perfil.xpPorNivel) * 100}%"></div></div>
      <span>★ ${perfil.dados.rating}</span>
    </div>`;
  barra.querySelectorAll('[data-nav]').forEach((b) => {
    b.onclick = () => navegar(b.dataset.nav);
  });
  return barra;
}
