// HUD do jogo em DOM sobre o canvas: vida, mana, slots com recarga, cronómetro.
import { ELEMENTOS, RODADA } from '@codex/shared';

export function criarHud(palco, loadout, meuId) {
  const hud = document.createElement('div');
  hud.className = 'hud';
  hud.innerHTML = `
    <div class="hud-barra-vida esq">
      <div class="nome" data-nome0></div>
      <div class="hud-vida"><div class="cheio" data-vida0></div><div class="escudo" data-esc0></div></div>
    </div>
    <div class="hud-barra-vida dir">
      <div class="nome" data-nome1></div>
      <div class="hud-vida"><div class="cheio" data-vida1></div><div class="escudo" data-esc1></div></div>
    </div>
    <div class="hud-topo">
      <div class="hud-crono" data-crono></div>
      <div class="hud-placar" data-placar></div>
    </div>
    <div class="hud-avisos" data-avisos></div>
    <div class="controlos-ajuda">WASD mover · rato mirar · 1–6 lançar · clique = slot 1 · espaço dash</div>
    <div class="hud-mana-slots">
      <div class="hud-slots" data-slots></div>
      <div class="hud-mana"><div data-mana></div></div>
    </div>`;
  palco.appendChild(hud);

  const $ = (sel) => hud.querySelector(sel);
  const slotsEl = $('[data-slots]');
  slotsEl.innerHTML = loadout
    .map((f, i) => `
      <div class="hud-slot" data-slot="${i}">
        <div class="tecla">${i + 1}</div>
        <div class="nome">${f ? f.nome : '—'}</div>
        <div class="recarga" style="display:none" data-rec="${i}"></div>
      </div>`)
    .join('');

  let ultimoErro = 0;

  function atualizar(snap) {
    const [j0, j1] = snap.jogadores;
    if (!j1) return;
    const euEsq = j0.id === meuId;
    const esq = euEsq ? j0 : j1;
    const dir = euEsq ? j1 : j0;
    $('[data-nome0]').textContent = `${esq.nome} ${esq.id === meuId ? '(tu)' : ''}`;
    $('[data-nome1]').textContent = `${dir.nome}`;
    $('[data-vida0]').style.width = Math.max(0, esq.vida) + '%';
    $('[data-esc0]').style.width = Math.min(100, esq.escudo) + '%';
    $('[data-vida1]').style.width = Math.max(0, dir.vida) + '%';
    $('[data-esc1]').style.width = Math.min(100, dir.escudo) + '%';

    const crono = $('[data-crono]');
    crono.textContent = snap.sobremorte ? '☠' : `${Math.ceil(snap.tRestante)}s`;
    crono.classList.toggle('sobremorte', !!snap.sobremorte);
    $('[data-placar]').textContent = `Ronda ${snap.round} · ${snap.placar[0]} — ${snap.placar[1]}  (melhor de ${RODADA.roundsParaVencer * 2 - 1})`;

    const eu = snap.jogadores.find((j) => j.id === meuId);
    if (eu) {
      $('[data-mana]').style.width = eu.mana + '%';
      for (let i = 0; i < 6; i++) {
        const el = slotsEl.querySelector(`[data-slot="${i}"]`);
        const rec = slotsEl.querySelector(`[data-rec="${i}"]`);
        const f = loadout[i];
        el.classList.toggle('sem-mana', !!f && eu.mana < f.custoMana);
        if (eu.recargas[i] > 0.05) {
          rec.style.display = 'flex';
          rec.textContent = eu.recargas[i].toFixed(1);
        } else {
          rec.style.display = 'none';
        }
      }
    }
  }

  function aviso(texto, magia = false) {
    const agora = performance.now();
    if (agora - ultimoErro < 800) return; // evita enxurrada de avisos
    ultimoErro = agora;
    const caixa = $('[data-avisos]');
    const el = document.createElement('div');
    el.className = 'aviso' + (magia ? ' magia' : '');
    el.textContent = texto;
    caixa.appendChild(el);
    setTimeout(() => el.remove(), 4200);
    while (caixa.children.length > 3) caixa.firstChild.remove();
  }

  function destruir() { hud.remove(); }

  return { atualizar, aviso, destruir, elemento: hud };
}

export function corElemento(elem) { return ELEMENTOS[elem]?.cor ?? '#c77dff'; }
