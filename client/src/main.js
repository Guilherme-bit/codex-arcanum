// Codex Arcanum — ponto de entrada: router por hash e ciclo de vida dos ecrãs.
import './estilo.css';
import { ecraInicio, ecraPoligono, ecraDuelo, ecraPerfil } from './ui/menus.js';
import { ecraAcademia, ecraLicao } from './ui/academia.js';
import { ecraGrimorio, ecraEditor } from './ui/grimorio.js';
import { ecraTomo } from './ui/tomo.js';
import { som } from './audio.js';

const app = document.getElementById('app');
let limpezaAtual = null;

function parametros(hash) {
  const semRota = hash.split('?')[1] ?? '';
  return new URLSearchParams(semRota);
}

async function render() {
  const hash = location.hash || '#/inicio';
  const caminho = hash.split('?')[0];
  const partes = caminho.replace(/^#\//, '').split('/');
  const params = parametros(hash);

  if (limpezaAtual) {
    try { limpezaAtual.destruir(); } catch { /* já removido */ }
    limpezaAtual = null;
    app.innerHTML = '';
  }

  // desbloqueia o áudio no primeiro gesto (política dos browsers)
  const desbloquear = () => som('ui');
  window.addEventListener('pointerdown', desbloquear, { once: true });

  let ecra;
  switch (partes[0]) {
    case 'academia':
      ecra = partes[1] ? await ecraLicao(app, +partes[1]) : ecraAcademia(app);
      break;
    case 'grimorio':
      ecra = ecraGrimorio(app);
      break;
    case 'tomo':
      ecra = ecraTomo(app);
      break;
    case 'editor':
      ecra = await ecraEditor(app, partes[1] ?? 'novo', params);
      break;
    case 'poligono':
      ecra = ecraPoligono(app);
      break;
    case 'duelo':
      ecra = ecraDuelo(app);
      break;
    case 'perfil':
      ecra = ecraPerfil(app);
      break;
    case 'inicio':
    default:
      ecra = ecraInicio(app);
      break;
  }
  limpezaAtual = ecra;
}

window.addEventListener('hashchange', render);
render();
