// Academia: os 8 capítulos com teoria, editor e verificação automática.
import { LICOES, verificarLicao, RECOMPENSAS_XP, componentesDesbloqueados } from '@codex/shared';
import { perfil } from '../perfil.js';
import { criarBarraTopo, navegar } from './comum.js';
import { criarEditor, validarCodigo } from './editor.js';
import { som } from '../audio.js';

export function ecraAcademia(raiz) {
  raiz.appendChild(criarBarraTopo('academia'));
  const ecra = document.createElement('div');
  ecra.className = 'ecra';
  ecra.innerHTML = `
    <h1>Academia Arcana</h1>
    <p class="subtitulo">Oito capítulos. Cada um desbloqueia um componente novo da tua magia.</p>
    <div class="grelha-caps" data-caps></div>`;
  raiz.appendChild(ecra);

  const caps = ecra.querySelector('[data-caps]');
  caps.innerHTML = LICOES.map((l) => {
    const feita = perfil.licaoFeita(l.id);
    const anteriorFeita = l.id === 1 || perfil.licaoFeita(l.id - 1);
    const estado = feita
      ? '<span class="feito">✔ concluído</span>'
      : anteriorFeita ? '<span class="desbloqueia">✦ disponível</span>' : '<span>🔒 termina o capítulo anterior</span>';
    return `
      <div class="cap-cartao ${feita ? 'feito' : ''} ${anteriorFeita ? '' : 'bloqueado'}" data-cap="${l.id}">
        <div class="cap-num">CAPÍTULO ${l.id} · desbloqueia ${l.desbloqueia}</div>
        <h3>${l.titulo}</h3>
        <div class="cap-conceito">${l.conceito}</div>
        <div class="cap-estado">${estado}</div>
      </div>`;
  }).join('');

  caps.querySelectorAll('[data-cap]').forEach((el) => {
    const id = +el.dataset.cap;
    if (id > 1 && !perfil.licaoFeita(id - 1)) return;
    el.onclick = () => navegar('#/academia/' + id);
  });

  return { destruir() {} };
}

export async function ecraLicao(raiz, idLicao) {
  raiz.appendChild(criarBarraTopo('academia'));
  const licao = LICOES.find((l) => l.id === idLicao);
  if (!licao) { location.hash = '#/academia'; return null; }

  const layout = document.createElement('div');
  layout.className = 'licao-layout';
  layout.innerHTML = `
    <div class="teoria">
      <h2>${licao.id}. ${licao.titulo}</h2>
      <div class="conceito">${licao.conceito} · desbloqueia <strong>${licao.desbloqueia}</strong></div>
      ${licao.teoria}
    </div>
    <div class="painel-editor">
      <div class="enunciado">
        <div class="rotulo">DESAFIO</div>
        ${licao.desafio.enunciado}
        <div class="dica-caixa">Precisas de uma ajuda?<button class="mini" data-dica>Mostrar dica</button><span data-dica-txt></span></div>
      </div>
      <div class="caixa-editor" data-editor></div>
      <div class="editor-barra">
        <button class="primario" data-verificar>⚡ Verificar</button>
        <button data-exemplo>Ver exemplo</button>
        <button data-testar>Testar no Polígono</button>
        <span class="estado-validacao" data-estado></span>
        <span data-info style="color:var(--texto-2); font-size:12.5px;"></span>
      </div>
      <div class="relatorio-verificacao" data-relatorio style="display:none"></div>
    </div>`;
  raiz.appendChild(layout);

  const estadoEl = layout.querySelector('[data-estado]');
  const infoEl = layout.querySelector('[data-info]');
  const relatorioEl = layout.querySelector('[data-relatorio]');

  layout.querySelector('[data-dica]').onclick = () => {
    layout.querySelector('[data-dica-txt]').textContent = ' ' + licao.desafio.dica;
    if (!perfil.dicaUsada(licao.id)) {
      perfil.marcarDica(licao.id);
      avisoTinta('🖋 Consultaste o Tomo do Mestre: o teu feitiço desta lição guardará Tinta de Treino (−25% de dano até purificares a tinta com 2 vitórias). Sem pressa — aprender vale isso.');
    }
  };

  function avisoTinta(texto) {
    relatorioEl.style.display = 'block';
    relatorioEl.innerHTML = `<div class="linha tinta-linha"><span>🖋</span><span>${texto}</span></div>` + relatorioEl.innerHTML;
  }

  let editor;
  try {
    editor = await criarEditor(layout.querySelector('[data-editor]'), {
      valor: licao.desafio.codigoInicial,
      aoMudar: validar,
    });
  } catch (e) {
    estadoEl.textContent = 'Editor indisponível: ' + e.message;
    return { destruir() {} };
  }

  function validar(codigo) {
    const r = validarCodigo(codigo);
    editor.definirMarcadores(r.ok ? [] : r.erros);
    estadoEl.textContent = r.ok ? '✓ feitiço válido' : '✗ ' + r.erros[0];
    estadoEl.className = 'estado-validacao ' + (r.ok ? 'ok' : 'mal');
    if (r.ok) {
      infoEl.textContent = `${r.feitico.nome} · ${r.feitico.elemento} · complexidade ${r.feitico.complexidade}`;
    } else {
      infoEl.textContent = '';
    }
    return r;
  }

  layout.querySelector('[data-exemplo]').onclick = () => {
    editor.definirValor(licao.exemplo);
    validar(licao.exemplo);
  };

  layout.querySelector('[data-testar]').onclick = () => {
    const codigo = editor.obterValor();
    const r = validar(codigo);
    if (!r.ok) return;
    sessionStorage.setItem('codex-testar-codigo', codigo);
    navegar('#/poligono');
  };

  layout.querySelector('[data-verificar]').onclick = () => {
    const codigo = editor.obterValor();
    const r = validar(codigo);
    relatorioEl.style.display = 'block';
    if (!r.ok) {
      relatorioEl.innerHTML = r.erros.map((e) => `<div class="linha"><span class="falha">✗</span><span>${e}</span></div>`).join('');
      som('erro');
      return;
    }
    const v = verificarLicao(licao.id, codigo);
    relatorioEl.innerHTML = v.relatorio
      .map((x) => `<div class="linha"><span class="${x.ok ? 'ok' : 'falha'}">${x.ok ? '✔' : '✗'}</span><span>${x.texto}</span></div>`)
      .join('') + (v.ok ? '<div class="linha ok">✦ Desafio concluído!</div>' : '');
    if (v.ok && !perfil.licaoFeita(licao.id)) {
      const usouDica = perfil.dicaUsada(licao.id);
      perfil.concluirLicao(licao.id);
      const novoNivel = perfil.adicionarXP(RECOMPENSAS_XP.licao);
      som(novoNivel ? 'nivel' : 'vitoria');
      const extra = novoNivel
        ? `<div class="linha ok">NÍVEL ${novoNivel}! Componentes novos: ${componentesDesbloqueados(novoNivel).join(', ')}</div>`
        : '';
      const mensagemTinta = usouDica
        ? `<div class="linha tinta-linha"><span>🖋</span><span>Guarda o feitiço e ele chega com <strong>Tinta de Treino</strong>
           (−25% de dano) — obras escritas com a ajuda do Tomo precisam de 2 vitórias em duelo para a tinta desbotar
           e revelar o teu verdadeiro poder.</span></div>`
        : `<div class="linha ok">✒ <strong>Feitiço Purificado</strong> — escrito pela tua própria mão, sem consultar o Tomo. Poder pleno desde já.</div>`;
      relatorioEl.innerHTML += `
        ${extra}
        <div class="linha ok">+${RECOMPENSAS_XP.licao} XP · componente <strong>${licao.desbloqueia}</strong> desbloqueado!</div>
        ${mensagemTinta}
        <div class="linha">
          <button class="mini primario" data-guardar-feitico>Guardar o meu feitiço no Grimório</button>
          <button class="mini" data-continuar>Continuar →</button>
        </div>`;
      relatorioEl.querySelector('[data-continuar]').onclick = () => navegar('#/academia');
      relatorioEl.querySelector('[data-guardar-feitico]').onclick = (e) => {
        const g = perfil.guardarFeitico(codigo, { tinta: usouDica });
        if (g.ok) {
          som('vitoria');
          e.target.textContent = '✓ guardado no Grimório';
          e.target.disabled = true;
        }
      };
    } else if (v.ok) {
      som('vitoria');
    } else {
      som('erro');
    }
  };

  return {
    destruir() { editor?.destruir(); },
  };
}
