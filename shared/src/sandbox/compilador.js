// ─────────────────────────────────────────────────────────────────────────────
// Compilador de feitiços — o coração da sandbox.
//  1. Analisa o código do jogador com acorn (parser JavaScript).
//  2. Rejeita magia proibida (eval, Function, constructor, import, globals...).
//  3. Instrumenta ciclos com verificações de passos (proteção contra loops infinitos).
//  4. Executa a definição num wrapper isolado e captura o objeto de feitiço.
//  5. Traduz todos os erros para mensagens mágicas temáticas em português.
// ─────────────────────────────────────────────────────────────────────────────
import { parse } from 'acorn';
import { ELEMENTOS } from '../constantes.js';

export class ErroFeitico extends Error {}

const PASSOS_COMPILACAO = 20000;

// Nomes escondidos do código do feitiço (sombreados como parâmetros do wrapper).
const SOMBRAS = [...new Set([
  'window', 'document', 'globalThis', 'self', 'top', 'parent', 'frames',
  'fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'Worker', 'SharedWorker',
  'localStorage', 'sessionStorage', 'indexedDB', 'caches', 'navigator', 'location',
  'history', 'alert', 'confirm', 'prompt', 'open', 'close', 'postMessage', 'importScripts',
  'require', 'module', 'exports', 'process', 'Buffer', 'global',
  'setTimeout', 'setInterval', 'setImmediate', 'clearTimeout', 'clearInterval',
  'queueMicrotask', 'structuredClone', 'crypto', 'performance', 'Date',
  'console',
])];

// Identificadores cujo uso direto é proibido no grimório.
const PROIBIDOS = new Set(['eval', 'Function']);
// Propriedades proibidas (fuga por protótipos).
const PROPS_PROIBIDAS = new Set(['constructor', '__proto__', '__defineGetter__', '__defineSetter__']);

const TRIG = new Set(['sin', 'cos', 'tan', 'atan', 'atan2', 'asin', 'acos', 'hypot', 'sqrt', 'pow']);

const TIPOS_CICLO = new Set([
  'WhileStatement', 'DoWhileStatement', 'ForStatement', 'ForInStatement', 'ForOfStatement',
]);

const NOMES_HOOKS = [
  'aoLancar', 'aCadaTick', 'aoAcertar', 'aoSerAcertado',
  'quandoVidaBaixa', 'quandoInimigoPerto', 'quandoInimigoLonge',
];

// ── Utilidades AST ───────────────────────────────────────────────────────────
function* filhos(no) {
  for (const k in no) {
    if (k === 'type' || k === 'loc' || k === 'start' || k === 'end' || k === 'range') continue;
    const v = no[k];
    if (Array.isArray(v)) { for (const x of v) if (x && typeof x.type === 'string') yield x; }
    else if (v && typeof v.type === 'string') yield v;
  }
}

function percorrer(no, cb, profCiclo = 0) {
  if (!no) return;
  cb(no, profCiclo);
  const p = TIPOS_CICLO.has(no.type) ? profCiclo + 1 : profCiclo;
  for (const f of filhos(no)) percorrer(f, cb, p);
}

// ── Tradução de erros para linguagem mágica ─────────────────────────────────
export function traduzirSintaxe(e, codigo = '') {
  const linha = e?.loc?.line ?? '?';
  const msg = e?.message ?? String(e);
  const mTok = msg.match(/Unexpected token (.+?)[\s(]/);
  const noFim = typeof e?.pos === 'number' && codigo.length > 0 && e.pos >= codigo.length - 2;
  if (noFim || /end of input|Unexpected end/i.test(msg)) {
    return `O teu grimório estalou: o código termina abruptamente — falta fechar uma chaveta «}» ou um parêntese «)» por volta da linha ${linha}.`;
  }
  if (mTok && mTok[1] === '}') {
    return `Uma chaveta «}» surgiu sem parceiro na linha ${linha} — pode faltar um «)» ou uma vírgula antes dela.`;
  }
  if (mTok) {
    return `Uma runa inesperada ${mTok[1]} surgiu na linha ${linha}. Verifica vírgulas, parênteses e chavetas.`;
  }
  if (/Unexpected identifier/i.test(msg)) {
    return `Um nome surgiu fora do sítio na linha ${linha}. Pode faltar uma vírgula, um «(» ou um «=».`;
  }
  if (/Invalid regular expression/i.test(msg)) {
    return `Há uma inscrição ilegível (expressão inválida) na linha ${linha}.`;
  }
  if (/reserved word/i.test(msg)) {
    return `Usaste uma palavra reservada da língua arcana na linha ${linha}. Escolhe outro nome.`;
  }
  return `Erro de sintaxe na linha ${linha}: ${msg}`;
}

export function traduzirRuntime(e) {
  if (e instanceof ErroFeitico) return e.message;
  const msg = e?.message ?? String(e);
  if (e instanceof RangeError || /Maximum call stack/i.test(msg)) {
    return 'Recursão infinita! O feitiço entrou em espiral e o grimório fechou-se de repente.';
  }
  const mNome = msg.match(/(\w+) is not defined/);
  if (e instanceof ReferenceError && mNome) {
    return `«${mNome[1]}» não existe neste mundo mágico. Declara-o com let ou const antes de o usares.`;
  }
  if (/is not a function/.test(msg)) {
    return 'Invocaste algo que não existe na API de magia. Confere os nomes — por exemplo ctx.invocar({ tipo: "projetil", ... }).';
  }
  if (/Cannot read propert/.test(msg)) {
    return 'Tocaste em algo que não existe (undefined). O inimigo pode ter desaparecido — protege com if (inimigo) ...';
  }
  return `O teu feitiço estalou: ${msg}`;
}

// ── Análise estática + instrumentação ───────────────────────────────────────
export function analisarCodigo(codigo) {
  const erros = [];
  const flags = {
    nos: 0, ifs: 0, ciclos: 0, maxProfCiclo: 0, chamadas: 0,
    declaraFuncao: false, usaVariavel: false, usaTrig: false,
    usaInvocar: false, usaHookEventos: false,
  };
  const edits = []; // inserções de __passo nos ciclos

  let ast;
  try {
    ast = parse(codigo, { ecmaVersion: 2022, locations: true });
  } catch (e) {
    return { erros: [traduzirSintaxe(e, codigo)], flags, instrumentado: null };
  }

  percorrer(ast, (no, prof) => {
    flags.nos++;
    switch (no.type) {
      case 'IfStatement': flags.ifs++; break;
      case 'VariableDeclaration': flags.usaVariavel = true; break;
      case 'FunctionDeclaration': flags.declaraFuncao = true; break;
      case 'CallExpression': case 'NewExpression': flags.chamadas++; break;
      case 'ImportExpression':
        erros.push('Importações pertencem à magia proibida — o feitiço não pode trazer coisas de fora.');
        break;
      case 'DebuggerStatement':
        erros.push('O encantamento «debugger» não é permitido dentro do grimório.');
        break;
      case 'Property': {
        const k = no.key?.name;
        if (k === 'aoAcertar' || k === 'aoSerAcertado' || k === 'aCadaTick' || k === 'quandoVidaBaixa' || k === 'quandoInimigoPerto' || k === 'quandoInimigoLonge') {
          flags.usaHookEventos = true;
        }
        break;
      }
      case 'Identifier': {
        if (PROIBIDOS.has(no.name)) {
          erros.push(`«${no.name}» é magia proibida no Codex Arcanum.`);
        } else if (no.name.startsWith('__')) {
          erros.push(`Nomes começados por «__» são reservados da sandbox (linha ${no.loc?.start.line}).`);
        }
        break;
      }
      case 'MemberExpression': {
        const alvo = no.object;
        const prop = no.property;
        if (!no.computed && prop.type === 'Identifier' && PROPS_PROIBIDAS.has(prop.name)) {
          erros.push(`Acesso a «.${prop.name}» é magia proibida.`);
        }
        if (no.computed && prop.type === 'Literal' && PROPS_PROIBIDAS.has(String(prop.value))) {
          erros.push(`Acesso a «[\"${prop.value}\"]» é magia proibida.`);
        }
        if (alvo.type === 'Identifier' && alvo.name === 'Math' && prop.type === 'Identifier' && TRIG.has(prop.name)) {
          flags.usaTrig = true;
        }
        break;
      }
      case 'Literal':
        if (typeof no.value === 'string' && PROPS_PROIBIDAS.has(no.value)) {
          erros.push(`A string proibida «${no.value}» não pode aparecer no feitiço.`);
        }
        break;
    }
    if (TIPOS_CICLO.has(no.type)) {
      flags.ciclos++;
      if (prof > flags.maxProfCiclo) flags.maxProfCiclo = prof;
      const corpo = no.body;
      const linha = no.loc?.start?.line ?? 0;
      if (corpo && corpo.type === 'BlockStatement') {
        edits.push({ pos: corpo.start + 1, txt: ` __passo(${linha});` });
      } else if (corpo) {
        edits.push({ pos: corpo.start, txt: `{ __passo(${linha});` });
        edits.push({ pos: corpo.end, txt: `}` });
      }
    }
    if (no.type === 'CallExpression' && no.callee?.type === 'MemberExpression') {
      const c = no.callee;
      if (c.object?.type === 'MemberExpression' && c.object.property?.name === 'invocar') flags.usaInvocar = true;
      if (c.object?.type === 'Identifier' && c.object.name === 'ctx' && c.property?.name === 'invocar') flags.usaInvocar = true;
    }
  });

  // Aplica as inserções da direita para a esquerda (os offsets mantêm-se válidos).
  let instrumentado = codigo;
  edits.sort((a, b) => b.pos - a.pos);
  for (const e of edits) {
    instrumentado = instrumentado.slice(0, e.pos) + e.txt + instrumentado.slice(e.pos);
  }
  return { erros, flags, instrumentado, ast };
}

export function complexidadeDe(flags) {
  return Math.min(40, Math.max(4, Math.round(flags.nos / 14) + flags.ciclos * 4 + flags.maxProfCiclo * 2 + flags.chamadas));
}

// ── Despachantes mutáveis (passos e aleatoriedade trocam de alvo a cada hook) ─
export function criarDespachante(padrao = null) {
  let alvo = padrao;
  const fn = (...a) => { if (alvo) alvo(...a); };
  fn.definirAlvo = (x) => { alvo = x; };
  return fn;
}

// Math sem Math.random + com aleatorio() determinístico injectado.
export function criarMatematica(despRng) {
  const m = {};
  for (const k of Object.getOwnPropertyNames(Math)) {
    if (k !== 'random') m[k] = Math[k];
  }
  m.aleatorio = () => despRng();
  return Object.freeze(m);
}

const LIMITES_DEF = { custoMana: [0, 80, 10], recarga: [0.15, 30, 1], duracaoAtiva: [0.5, 10, 3] };
const limitar = (v, min, max, def) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def;
};

// ── Compilação principal ─────────────────────────────────────────────────────
// Devolve { ok:true, feitico } ou { ok:false, erros:[...], flags }.
export function compilarFeitico(codigo) {
  const analise = analisarCodigo(codigo);
  if (analise.erros.length) return { ok: false, erros: analise.erros, flags: analise.flags };

  const despPasso = criarDespachante();
  const despRng = criarDespachante();
  const consola = { log() {}, warn() {}, error() {}, info() {} };
  const contador = { n: 0 };
  despPasso.definirAlvo((linha) => {
    if (++contador.n > PASSOS_COMPILACAO) {
      throw new ErroFeitico('O grimório demorou demasiado a ser lido — a definição do feitiço é demasiado complexa.');
    }
  });

  const corpo =
    "'use strict';\n" +
    'const feitico = __api;\n' +
    'const Math = __math;\n' +
    'const aleatorio = __aleatorio;\n' +
    'const escrever = (...a) => __consola.log(...a);\n' +
    analise.instrumentado;

  let fabrica;
  try {
    fabrica = new Function(...SOMBRAS, '__api', '__passo', '__aleatorio', '__consola', '__math', corpo);
  } catch (e) {
    return { ok: false, erros: [traduzirSintaxe(e)], flags: analise.flags };
  }

  const definicoes = [];
  try {
    fabrica(
      ...SOMBRAS.map(() => undefined), // esconde os globals do mundo real
      { definir: (d) => definicoes.push(d) },
      despPasso,
      despRng,
      consola,
      criarMatematica(despRng),
    );
  } catch (e) {
    return { ok: false, erros: [traduzirRuntime(e)], flags: analise.flags };
  }

  if (!definicoes.length) {
    return {
      ok: false,
      erros: ['Nenhum feitiço definido — o código tem de chamar feitico.definir({ ... }).'],
      flags: analise.flags,
    };
  }

  const d = definicoes[0];
  const hooks = {};
  for (const h of NOMES_HOOKS) {
    if (typeof d[h] === 'function') hooks[h] = d[h];
  }
  if (!hooks.aoLancar && !hooks.aCadaTick && !hooks.quandoVidaBaixa && !hooks.quandoInimigoPerto && !hooks.quandoInimigoLonge && !hooks.quandoInimigoLonge) {
    return {
      ok: false,
      erros: ['O feitiço não faz nada — define pelo menos um encantamento, ex.: aoLancar(ctx) { ... }'],
      flags: analise.flags,
    };
  }

  const elemento = ELEMENTOS[d.elemento] ? d.elemento : 'arcano';
  const feitico = {
    nome: String(d.nome ?? 'Feitiço Sem Nome').slice(0, 24),
    elemento,
    custoMana: limitar(d.custoMana, ...LIMITES_DEF.custoMana),
    recarga: limitar(d.recarga, ...LIMITES_DEF.recarga),
    duracaoAtiva: limitar(d.duracaoAtiva, ...LIMITES_DEF.duracaoAtiva),
    complexidade: complexidadeDe(analise.flags),
    flags: analise.flags,
    hooks,
    __despPasso: despPasso,
    __despRng: despRng,
    codigo,
  };
  return { ok: true, feitico };
}

// Versão de conveniência para o editor: devolve só a lista de erros (vazia = válido).
export function errosDeCodigo(codigo) {
  const r = compilarFeitico(codigo);
  return r.ok ? [] : r.erros;
}
