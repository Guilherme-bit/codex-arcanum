// Editor de feitiços baseado no Monaco, com autocomplete da API de magia,
// tema arcano e validação em tempo real pelo nosso compilador temático.
import { compilarFeitico } from '@codex/shared';

let monaco = null;
let carregando = null;
let provedorRegistado = false;

const API_SUGESTOES = [
  {
    rotulo: 'feitico.definir',
    tipo: 'snippet',
    corpo: 'feitico.definir({\n  nome: "${1:Nome do Feitiço}",\n  elemento: "${2|fogo,agua,terra,ar,arcano|}",\n  custoMana: ${3:12},\n  recarga: ${4:1.0},\n  aoLancar(ctx) {\n    $0\n  },\n});',
    doc: 'Estrutura base de um feitiço.',
  },
  { rotulo: 'ctx.invocar', tipo: 'method', corpo: 'ctx.invocar({\n  tipo: "projetil",\n  direcao: ctx.anguloParaInimigo(),\n  dano: 8,\n});', doc: 'Invoca um componente mágico: projetil, feixe, area, armadilha, escudo, aura, dash ou teleporte.' },
  { rotulo: 'projetil', tipo: 'snippet', corpo: 'ctx.invocar({\n  tipo: "projetil",\n  direcao: ${1:ctx.anguloParaInimigo()},\n  velocidade: ${2:400},\n  dano: ${3:8},\n  raio: ${4:6},\n  aoAcertar(alvo) {\n    alvo.aplicar("queimadura", { dps: 2, duracao: 3 });\n  },\n});', doc: 'Projétil que viaja e colide. Opções: direcao (rad), velocidade, dano, raio, vida (s), efeitos, aoAcertar(alvo).' },
  { rotulo: 'feixe', tipo: 'snippet', corpo: 'ctx.invocar({\n  tipo: "feixe",\n  direcao: ${1:ctx.anguloMira()},\n  alcance: ${2:380},\n  dano: ${3:14},\n  largura: ${4:8},\n});', doc: 'Raio instantâneo numa linha. Opções: direcao, alcance, dano, largura, efeitos.' },
  { rotulo: 'area', tipo: 'snippet', corpo: 'ctx.invocar({\n  tipo: "area",\n  centro: "${1|eu,mira|}",\n  raio: ${2:80},\n  dano: ${3:14},\n  efeitos: [{ estado: "lento", duracao: 2 }],\n});', doc: 'Explosão à tua volta ("eu") ou no ponto de mira ("mira").' },
  { rotulo: 'armadilha', tipo: 'snippet', corpo: 'ctx.invocar({\n  tipo: "armadilha",\n  direcao: ${1:ctx.anguloMira()},\n  distancia: ${2:100},\n  raio: ${3:34},\n  dano: ${4:15},\n  duracao: ${5:8},\n});', doc: 'Rune à espera que o inimigo pise nela.' },
  { rotulo: 'escudo', tipo: 'method', corpo: 'ctx.escudo({ vida: ${1:40} });', doc: 'Absorve dano antes da vida. Quebra ao esgotar.' },
  { rotulo: 'aura', tipo: 'snippet', corpo: 'ctx.aura({ raio: ${1:90}, dps: ${2:4}, duracao: ${3:4} });', doc: 'Aura que fere inimigos dentro do raio, enquanto durar.' },
  { rotulo: 'ctx.dash', tipo: 'method', corpo: 'ctx.dash({ distancia: ${1:130} });', doc: 'Deslocamento rápido na direção indicada (ou da mira).' },
  { rotulo: 'ctx.teleporte', tipo: 'method', corpo: 'ctx.teleporte({ distancia: ${1:200} });', doc: 'Salto instantâneo na direção indicada (ou da mira).' },
  { rotulo: 'ctx.anguloParaInimigo', tipo: 'method', corpo: 'ctx.anguloParaInimigo()', doc: 'Ângulo (radianos) na direção do inimigo.' },
  { rotulo: 'ctx.anguloMira', tipo: 'method', corpo: 'ctx.anguloMira()', doc: 'Ângulo para onde o rato aponta.' },
  { rotulo: 'ctx.distanciaInimigo', tipo: 'method', corpo: 'ctx.distanciaInimigo()', doc: 'Distância ao inimigo (unidades).' },
  { rotulo: 'ctx.inimigo', tipo: 'method', corpo: 'ctx.inimigo()', doc: 'Dados do inimigo: { x, y, vx, vy, vida, escudo } — vx/vy permitem mira preditiva.' },
  { rotulo: 'ctx.pos', tipo: 'method', corpo: 'ctx.pos()', doc: 'A tua posição { x, y }.' },
  { rotulo: 'ctx.mira', tipo: 'method', corpo: 'ctx.mira()', doc: 'Ponto do mundo para onde o rato aponta { x, y }.' },
  { rotulo: 'ctx.vida', tipo: 'method', corpo: 'ctx.vida()', doc: 'A tua vida atual (0–100).' },
  { rotulo: 'ctx.mana', tipo: 'method', corpo: 'ctx.mana()', doc: 'A tua mana atual.' },
  { rotulo: 'ctx.tempo', tipo: 'method', corpo: 'ctx.tempo()', doc: 'Segundos restantes da ronda.' },
  { rotulo: 'ctx.aleatorio', tipo: 'method', corpo: 'ctx.aleatorio()', doc: 'Número aleatório determinístico 0..1 (Math.random é proibido).' },
  { rotulo: 'ctx.escrever', tipo: 'method', corpo: 'ctx.escrever(${1:"depuração"});', doc: 'Escreve na consola do jogo — o teu console.log mágico.' },
  { rotulo: 'aoAcertar', tipo: 'snippet', corpo: 'aoAcertar(alvo) {\n  alvo.aplicar("queimadura", { dps: ${1:2}, duracao: ${2:3} });\n}', doc: 'Hook do projétil: corre quando acerta um inimigo. alvo.aplicar(estado, opções), alvo.empurrar(ângulo, força).' },
  { rotulo: 'alvo.aplicar', tipo: 'method', corpo: 'alvo.aplicar("${1|queimadura,molhado,cego,lento,vento|}", { dps: ${2:2}, duracao: ${3:3} });', doc: 'Aplica um estado ao alvo. Sinergias: fogo+molhado=vapor, fogo+vento=explosão.' },
  { rotulo: 'aCadaTick', tipo: 'snippet', corpo: 'aCadaTick(ctx) {\n  $0\n},', doc: 'Hook do feitiço: corre em todos os ticks durante a duração ativa (duracaoAtiva, por omissão 3s).' },
  { rotulo: 'quandoVidaBaixa', tipo: 'snippet', corpo: 'quandoVidaBaixa(ctx) {\n  $0\n},', doc: 'Hook reativo: dispara quando a vida fica abaixo de 30%.' },
  { rotulo: 'quandoInimigoPerto', tipo: 'snippet', corpo: 'quandoInimigoPerto(ctx) {\n  $0\n},', doc: 'Hook reativo: o inimigo entrou no teu perímetro.' },
  { rotulo: 'quandoInimigoLonge', tipo: 'snippet', corpo: 'quandoInimigoLonge(ctx) {\n  $0\n},', doc: 'Hook reativo: o inimigo afastou-se.' },
  { rotulo: 'escrever', tipo: 'method', corpo: 'escrever(${1:valor});', doc: 'Alias de ctx.escrever — depuração no grimório.' },
  { rotulo: 'aleatorio', tipo: 'method', corpo: 'aleatorio()', doc: 'Alias de ctx.aleatorio.' },
];

async function carregarMonaco() {
  if (monaco) return monaco;
  if (!carregando) {
    carregando = (async () => {
      const [m, wEditor, wTs] = await Promise.all([
        import('monaco-editor'),
        import('monaco-editor/esm/vs/editor/editor.worker?worker'),
        import('monaco-editor/esm/vs/language/typescript/ts.worker?worker'),
      ]);
      self.MonacoEnvironment = {
        getWorker(_trabalho, etiqueta) {
          return (etiqueta === 'typescript' || etiqueta === 'javascript') ? new wTs.default() : new wEditor.default();
        },
      };
      // A validação pertence ao nosso compilador temático — desligamos a do TS.
      m.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: true,
        noSyntaxValidation: true,
      });
      m.editor.defineTheme('arcanum', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'keyword', foreground: 'c77dff' },
          { token: 'string', foreground: 'ffd166' },
          { token: 'number', foreground: '7cc4ff' },
          { token: 'comment', foreground: '6a5a9e', fontStyle: 'italic' },
          { token: 'delimiter', foreground: 'a89ede' },
        ],
        colors: {
          'editor.background': '#120d26',
          'editor.lineHighlightBackground': '#1d1544',
          'editorCursor.foreground': '#ffd166',
          'editorIndentGuide.background1': '#2a2050',
        },
      });
      monaco = m;
      return m;
    })();
  }
  return carregando;
}

function registarProvedor(m) {
  if (provedorRegistado) return;
  provedorRegistado = true;
  const tipoKind = {
    snippet: m.languages.CompletionItemKind.Snippet,
    method: m.languages.CompletionItemKind.Method,
    keyword: m.languages.CompletionItemKind.Keyword,
  };
  m.languages.registerCompletionItemProvider('javascript', {
    triggerCharacters: ['.', ' ', '('],
    provideCompletionItems(modelo, posicao) {
      const palavra = modelo.getWordUntilPosition(posicao);
      const alcance = {
        startLineNumber: posicao.lineNumber,
        endLineNumber: posicao.lineNumber,
        startColumn: palavra.startColumn,
        endColumn: palavra.endColumn,
      };
      const sugestoes = API_SUGESTOES.map((s) => ({
        label: s.rotulo,
        kind: tipoKind[s.tipo] ?? tipoKind.keyword,
        insertText: s.corpo,
        insertTextRules: s.tipo === 'snippet' ? m.languages.CompletionItemInsertTextRule.InsertAsSnippet : undefined,
        documentation: { value: s.doc },
        detail: 'API de Magia — Codex Arcanum',
        sortText: '0' + s.rotulo,
        range: alcance,
      }));
      return { suggestions: sugestoes };
    },
  });
}

function linhaDoErro(msg) {
  const m = msg.match(/linha (\d+)/);
  return m ? parseInt(m[1], 10) : 1;
}

// Cria o editor. Devolve { obterValor, definirValor, definirMarcadores, destruir }.
export async function criarEditor(container, { valor = '', aoMudar = null } = {}) {
  const m = await carregarMonaco();
  registarProvedor(m);
  const ed = m.editor.create(container, {
    value: valor,
    language: 'javascript',
    theme: 'arcanum',
    minimap: { enabled: false },
    fontSize: 14,
    automaticLayout: true,
    tabSize: 2,
    scrollBeyondLastLine: false,
    padding: { top: 10 },
  });
  let cronometro = null;
  const mudou = ed.onDidChangeModelContent(() => {
    if (!aoMudar) return;
    clearTimeout(cronometro);
    cronometro = setTimeout(() => aoMudar(ed.getValue()), 350);
  });
  return {
    obterValor: () => ed.getValue(),
    definirValor: (v) => { ed.setValue(v); },
    definirMarcadores: (erros) => {
      m.editor.setModelMarkers(ed.getModel(), 'grimorio', (erros ?? []).map((e) => {
        const linha = linhaDoErro(e);
        return {
          startLineNumber: linha, endLineNumber: linha,
          startColumn: 1, endColumn: 500,
          message: e,
          severity: m.MarkerSeverity.Error,
        };
      }));
    },
    destruir: () => { clearTimeout(cronometro); mudou.dispose(); ed.dispose(); },
  };
}

// Validação partilhada (mesmo compilador do servidor).
export function validarCodigo(codigo) {
  return compilarFeitico(codigo);
}
