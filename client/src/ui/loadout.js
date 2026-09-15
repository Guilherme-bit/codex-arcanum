// Seletor de loadout: 6 slots + lista de feitiços + orçamento de energia arcana.
// Partilhado pelo Polígono e pelo lobby de Duelo.
import { ELEMENTOS, ENERGIA_ARCANA_MAX, compilarFeitico, obterClassicos } from '@codex/shared';
import { perfil } from '../perfil.js';
import { som } from '../audio.js';

export function criarSeletorLoadout(container) {
  let slotSelecionado = 0;

  function corEtiqueta(elem) { return ELEMENTOS[elem]?.cor ?? '#c77dff'; }

  function desenhar() {
    const compilado = perfil.loadoutCompilado();
    const energia = compilado.filter(Boolean).reduce((s, f) => s + f.complexidade, 0);
    const meus = [
      ...obterClassicos(),
      ...perfil.dados.feiticos.map((f) => ({ ...f, pessoal: true })),
    ];

    container.innerHTML = `
      <div class="loadout-fila" data-slots></div>
      <div class="barra-energia ${energia > ENERGIA_ARCANA_MAX ? 'excedido' : ''}">
        <span>Energia arcana:</span>
        <div class="barra"><div style="width:${Math.min(100, (energia / ENERGIA_ARCANA_MAX) * 100)}%"></div></div>
        <span>${energia} / ${ENERGIA_ARCANA_MAX}${energia > ENERGIA_ARCANA_MAX ? ' — excedido!' : ''}</span>
      </div>
      <div class="grelha-feiticos" data-lista></div>`;

    const slots = container.querySelector('[data-slots]');
    slots.innerHTML = perfil.dados.loadout
      .map((id, i) => {
        const f = compilado[i];
        return `
          <div class="slot ${f ? 'cheio' : ''} ${i === slotSelecionado ? 'selecionado' : ''}" data-slot="${i}">
            <span class="tecla">${i + 1}</span>
            ${f ? `<span class="nome">${f.nome}</span><span class="elem" style="color:${corEtiqueta(f.elemento)}">● ${f.elemento}</span>` : '<span class="elem">vazio</span>'}
          </div>`;
      })
      .join('');

    const lista = container.querySelector('[data-lista]');
    lista.innerHTML = meus
      .map((f) => {
        let elem = 'arcano';
        let complexidade = '?';
        const compil = f.hooks ? f : compilarFeitico(f.codigo);
        if (compil && compil.ok !== false && (compil.hooks || compil.ok)) {
          const info = compil.ok ? compil.feitico : compil;
          elem = info.elemento ?? elem;
          complexidade = info.complexidade ?? complexidade;
        }
        return `
          <div class="feitico-cartao" data-id="${f.id}">
            <h3>${f.nome}</h3>
            <div class="meta">
              <span class="etiqueta-elem" style="background:${corEtiqueta(elem)}">${elem}</span>
              <span>complexidade ${complexidade}</span>
              ${f.pessoal ? '<span>✦ teu</span>' : '<span>clássico</span>'}
            </div>
            <div class="acoes">
              <button class="mini primario" data-equipar="${f.id}">Equipar no slot ${slotSelecionado + 1}</button>
              ${f.pessoal ? `<button class="mini" data-editar="${f.id}">Editar</button>
              <button class="mini perigo" data-apagar="${f.id}">Apagar</button>` : `<button class="mini" data-duplicar="${f.id}">Duplicar</button>`}
            </div>
          </div>`;
      })
      .join('');

    slots.querySelectorAll('[data-slot]').forEach((el) => {
      el.onclick = () => { slotSelecionado = +el.dataset.slot; som('ui'); desenhar(); };
    });
    lista.querySelectorAll('[data-equipar]').forEach((el) => {
      el.onclick = (e) => {
        e.stopPropagation();
        perfil.equipar(slotSelecionado, el.dataset.equipar);
        som('ui');
        desenhar();
      };
    });
    lista.querySelectorAll('[data-apagar]').forEach((el) => {
      el.onclick = (e) => {
        e.stopPropagation();
        perfil.apagarFeitico(el.dataset.apagar);
        som('erro');
        desenhar();
      };
    });
    lista.querySelectorAll('[data-editar]').forEach((el) => {
      el.onclick = (e) => { e.stopPropagation(); location.hash = '#/editor/' + el.dataset.editar; };
    });
    lista.querySelectorAll('[data-duplicar]').forEach((el) => {
      el.onclick = (e) => {
        e.stopPropagation();
        const f = perfil.feiticoPorId(el.dataset.duplicar);
        if (f) { location.hash = '#/editor/novo?de=' + el.dataset.duplicar; }
      };
    });
  }

  desenhar();
  return { redesenhar: desenhar };
}
