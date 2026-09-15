// O Tomo — biblioteca de feitiços de exemplo organizados por dificuldade de
// PROGRAMAÇÃO. Copiar um feitiço daqui ensina um padrão; chega com Tinta de
// Treino (−25% de dano) até ganhares 2 duelos com ele equipado.
import { BIBLIOTECA, TIERS } from '@codex/shared';
import { criarBarraTopo, navegar } from './comum.js';
import { perfil } from '../perfil.js';
import { som } from '../audio.js';

export function ecraTomo(raiz) {
  raiz.appendChild(criarBarraTopo('tomo'));
  const ecra = document.createElement('div');
  ecra.className = 'ecra';
  ecra.innerHTML = `
    <h1>O Tomo</h1>
    <p class="subtitulo">A biblioteca do Mestre: feitiços escritos por outros, ordenados pela dificuldade
    do <em>código</em> — não do poder. Copia os que quiseres, mas sabe que…</p>
    <div class="caixa-tinta">
      <strong>🖋 Tinta de Treino:</strong> feitiços copiados do Tomo (ou aprendidos com a dica do Mestre)
      chegam com tinta azul — causam <strong>25% menos dano</strong> e cintilam com runas douradas.
      Ganha <strong>2 duelos</strong> com o feitiço equipado e a tinta desbota: o feitiço torna-se
      verdadeiramente teu. Feitiços escritos pela tua mão nascem sem tinta.
    </div>
    <div class="filtros-tier" data-filtros></div>
    <div data-lista></div>`;
  raiz.appendChild(ecra);

  const lista = ecra.querySelector('[data-lista]');
  const filtros = ecra.querySelector('[data-filtros]');
  let tierAtivo = 'todos';

  function desenhar() {
    filtros.innerHTML = [`<button class="chip-filtro ${tierAtivo === 'todos' ? 'ativo' : ''}" data-tier="todos">Todos (${BIBLIOTECA.length})</button>`]
      .concat(TIERS.map((t) => {
        const n = BIBLIOTECA.filter((f) => f.tier === t.id).length;
        return `<button class="chip-filtro ${tierAtivo === t.id ? 'ativo' : ''}" data-tier="${t.id}" style="--cor-tier:${t.cor}">${t.nome} (${n})</button>`;
      })).join('');
    filtros.querySelectorAll('[data-tier]').forEach((b) => {
      b.onclick = () => { tierAtivo = b.dataset.tier; som('ui'); desenhar(); };
    });

    const visiveis = tierAtivo === 'todos' ? BIBLIOTECA : BIBLIOTECA.filter((f) => f.tier === tierAtivo);
    lista.innerHTML = TIERS
      .filter((t) => tierAtivo === 'todos' || tierAtivo === t.id)
      .map((t) => {
        const doTier = visiveis.filter((f) => f.tier === t.id);
        if (!doTier.length) return '';
        return `
          <h2 class="tier-titulo" style="color:${t.cor}">${t.nome} <span class="tier-desc">${t.descricao}</span></h2>
          <div class="grelha-feiticos">${doTier.map((f) => `
            <div class="feitico-cartao tomo-cartao">
              <h3>${f.nome}</h3>
              <div class="meta"><span class="etiqueta-elem" style="background:${t.cor}">${t.nome}</span><span>${f.conceito}</span></div>
              <p class="tomo-desc">${f.descricao}</p>
              <pre class="tomo-codigo">${escapar(f.codigo)}</pre>
              <div class="acoes">
                <button class="mini primario" data-copiar="${f.id}">🖋 Copiar ao Grimório (com tinta)</button>
                <button class="mini" data-estudar="${f.id}">Estudar no editor</button>
              </div>
            </div>`).join('')}</div>`;
      })
      .join('');

    lista.querySelectorAll('[data-copiar]').forEach((b) => {
      b.onclick = () => {
        const f = BIBLIOTECA.find((x) => x.id === b.dataset.copiar);
        const r = perfil.guardarFeitico(f.codigo, { tinta: true });
        if (r.ok) {
          som('nivel');
          b.textContent = '✓ no teu Grimório (com tinta)';
          setTimeout(() => { b.textContent = '🖋 Copiar ao Grimório (com tinta)'; }, 1800);
        } else {
          som('erro');
          alert('Não consegui copiar: ' + r.erros.join('\n'));
        }
      };
    });
    lista.querySelectorAll('[data-estudar]').forEach((b) => {
      b.onclick = () => {
        const f = BIBLIOTECA.find((x) => x.id === b.dataset.estudar);
        sessionStorage.setItem('codex-estudar-codigo', f.codigo);
        navegar('#/editor/novo');
      };
    });
  }

  function escapar(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  desenhar();
  return { destruir() {} };
}
