// Grimório: gestão dos feitiços pessoais, loadout e editor com export/import.
import { compilarFeitico } from '@codex/shared';
import { perfil } from '../perfil.js';
import { criarBarraTopo, navegar } from './comum.js';
import { criarEditor, validarCodigo } from './editor.js';
import { criarSeletorLoadout } from './loadout.js';
import { som } from '../audio.js';

const MODELO_NOVO = `feitico.definir({
  nome: "Novo Feitiço",
  elemento: "arcano",
  custoMana: 12,
  recarga: 1.0,
  aoLancar(ctx) {
    ctx.invocar({
      tipo: "projetil",
      direcao: ctx.anguloParaInimigo(),
      dano: 8,
    });
  },
});`;

export function ecraGrimorio(raiz) {
  raiz.appendChild(criarBarraTopo('grimorio'));
  const ecra = document.createElement('div');
  ecra.className = 'ecra';
  ecra.innerHTML = `
    <div style="display:flex; align-items:center; gap:14px; flex-wrap:wrap;">
      <h1>Grimório</h1>
      <button class="primario" data-novo>+ Novo Feitiço</button>
      <button data-importar>Importar JSON</button>
      <input type="file" accept=".json" data-ficheiro style="display:none"/>
    </div>
    <p class="subtitulo">Escolhe um slot e equipa os teus feitiços. A energia arcana limita builds excessivas.</p>
    <div data-loadout></div>`;
  raiz.appendChild(ecra);

  ecra.querySelector('[data-novo]').onclick = () => navegar('#/editor/novo');
  const ficheiro = ecra.querySelector('[data-ficheiro]');
  ecra.querySelector('[data-importar]').onclick = () => ficheiro.click();
  ficheiro.onchange = async () => {
    try {
      const dados = JSON.parse(await ficheiro.files[0].text());
      const codigo = dados.codigo ?? (typeof dados === 'string' ? dados : null);
      if (!codigo) throw new Error('ficheiro sem código');
      const r = perfil.guardarFeitico(codigo);
      if (!r.ok) { alert('Feitiço inválido:\n' + r.erros.join('\n')); return; }
      som('vitoria');
      navegar('#/grimorio');
    } catch (e) {
      alert('Não consegui ler o grimório importado: ' + e.message);
    }
  };

  const seletor = criarSeletorLoadout(ecra.querySelector('[data-loadout]'));
  return { destruir() {}, seletor };
}

export async function ecraEditor(raiz, id, params) {
  raiz.appendChild(criarBarraTopo('grimorio'));
  const ecra = document.createElement('div');
  ecra.className = 'ecra';
  ecra.innerHTML = `
    <div class="editor-barra">
      <button data-voltar>← Grimório</button>
      <button class="primario" data-guardar>Guardar no Grimório</button>
      <button data-testar>Testar no Polígono</button>
      <button data-exportar>Exportar JSON</button>
      <span class="estado-validacao" data-estado></span>
      <span data-info style="color:var(--texto-2); font-size:12.5px;"></span>
    </div>
    <div class="caixa-editor" data-editor style="height: calc(100vh - 130px); margin-top: 12px;"></div>`;
  raiz.appendChild(ecra);

  // valor inicial: existente, cópia de outro, estudo do Tomo, ou modelo novo
  let valor = MODELO_NOVO;
  const codigoEstudo = sessionStorage.getItem('codex-estudar-codigo');
  if (id !== 'novo') {
    const f = perfil.feiticoPorId(id);
    if (f) valor = f.codigo;
  } else if (codigoEstudo) {
    valor = codigoEstudo;
    sessionStorage.removeItem('codex-estudar-codigo');
  } else if (params.get('de')) {
    const origem = perfil.feiticoPorId(params.get('de'));
    if (origem) valor = origem.codigo.replace(/nome:\s*"[^"]*"/, 'nome: "Cópia de ' + origem.nome.replace(/"/g, '') + '"');
  }
  const idExistente = id !== 'novo' ? id : null;

  const estadoEl = ecra.querySelector('[data-estado]');
  const infoEl = ecra.querySelector('[data-info]');
  let editor;
  try {
    editor = await criarEditor(ecra.querySelector('[data-editor]'), { valor, aoMudar: validar });
  } catch (e) {
    estadoEl.textContent = 'Editor indisponível: ' + e.message;
    return { destruir() {} };
  }

  function validar(codigo) {
    const r = validarCodigo(codigo);
    editor.definirMarcadores(r.ok ? [] : r.erros);
    estadoEl.textContent = r.ok ? '✓ feitiço válido' : '✗ ' + r.erros[0];
    estadoEl.className = 'estado-validacao ' + (r.ok ? 'ok' : 'mal');
    infoEl.textContent = r.ok ? `${r.feitico.nome} · ${r.feitico.elemento} · complexidade ${r.feitico.complexidade} · custo ${r.feitico.custoMana} mana` : '';
    return r;
  }
  validar(valor);

  ecra.querySelector('[data-voltar]').onclick = () => navegar('#/grimorio');

  ecra.querySelector('[data-guardar]').onclick = () => {
    const codigo = editor.obterValor();
    const r = validar(codigo);
    if (!r.ok) { som('erro'); return; }
    const guardado = perfil.guardarFeitico(codigo);
    if (guardado.ok) {
      som('vitoria');
      estadoEl.textContent = '✓ guardado no grimório';
      navegar('#/grimorio');
    }
  };

  ecra.querySelector('[data-testar]').onclick = () => {
    const codigo = editor.obterValor();
    const r = validar(codigo);
    if (!r.ok) { som('erro'); return; }
    sessionStorage.setItem('codex-testar-codigo', codigo);
    navegar('#/poligono');
  };

  ecra.querySelector('[data-exportar]').onclick = () => {
    const codigo = editor.obterValor();
    const r = validarCodigo(codigo);
    const dados = {
      jogo: 'codex-arcanum',
      tipo: 'feitico',
      nome: r.ok ? r.feitico.nome : 'Feitiço Sem Nome',
      codigo,
    };
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (dados.nome || 'feitico').toLowerCase().replace(/\s+/g, '-') + '.json';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return {
    destruir() { editor?.destruir(); },
  };
}
