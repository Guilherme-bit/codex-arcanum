// Os 8 capítulos da Academia. Cada um desbloqueia um componente novo da API
// e termina num desafio verificado automaticamente (ver academia/verificar.js).
export const LICOES = [
  {
    id: 1,
    titulo: 'Primeiro Feitiço',
    conceito: 'Chamadas de função e argumentos',
    desbloqueia: 'projetil',
    teoria: `
      <p>Um feitiço é uma <strong>função</strong> que o jogo executa quando pressionas a tecla do slot.
      Escreve-o dentro de <code>feitico.definir({ ... })</code> e preenche as propriedades:</p>
      <pre>feitico.definir({
  nome: "Meu Feitiço",        // o teu título
  elemento: "fogo",           // fogo | agua | terra | ar | arcano
  custoMana: 10,              // gasto de mana por lançamento
  recarga: 0.8,               // segundos entre lançamentos
  aoLancar(ctx) { ... }       // o que acontece quando lanças
});</pre>
      <p><code>ctx</code> é a tua ligação ao mundo mágico. Para lançar um projétil:</p>
      <pre>ctx.invocar({ tipo: "projetil", direcao: ctx.anguloMira(), dano: 8 });</pre>
      <p>Repara: <code>ctx.invocar(...)</code> é uma <em>chamada de função</em> e
      <code>tipo: "projetil"</code> são <em>argumentos</em> que afinam a magia.</p>`,
    exemplo: `feitico.definir({
  nome: "Ping de Arcano",
  elemento: "arcano",
  custoMana: 8,
  recarga: 0.7,
  aoLancar(ctx) {
    ctx.invocar({
      tipo: "projetil",
      direcao: ctx.anguloParaInimigo(),
      velocidade: 400,
      dano: 7,
    });
  },
});`,
    desafio: {
      enunciado: 'Faz o teu feitiço invocar <strong>pelo menos um projétil</strong> que acerte no inimigo de treino. Usa <code>ctx.invocar({ tipo: "projetil", ... })</code> dentro do <code>aoLancar</code>.',
      codigoInicial: `feitico.definir({
  nome: "Meu Primeiro Feitiço",
  elemento: "fogo",
  custoMana: 10,
  recarga: 0.8,
  aoLancar(ctx) {
    // TODO: invoca um projétil!
    // direcao: ctx.anguloParaInimigo()  aponta para o inimigo
  },
});`,
      dica: 'ctx.invocar({ tipo: "projetil", direcao: ctx.anguloParaInimigo(), dano: 8 });',
    },
  },
  {
    id: 2,
    titulo: 'Variáveis',
    conceito: 'Guardar e reutilizar valores',
    desbloqueia: 'dash',
    teoria: `
      <p>Uma <strong>variável</strong> guarda um valor para o reutilizares. Em JavaScript usa-se
      <code>const</code> (valor fixo) ou <code>let</code> (valor que muda):</p>
      <pre>const angulo = ctx.anguloParaInimigo();
ctx.invocar({ tipo: "projetil", direcao: angulo, dano: 6 });
ctx.invocar({ tipo: "projetil", direcao: angulo + 0.3, dano: 6 });</pre>
      <p>Em vez de pedires o ângulo duas vezes, pedes <strong>uma vez</strong> e guardas.
      Isto torna o feitiço mais rápido de ler e mais barato de executar.</p>`,
    exemplo: `feitico.definir({
  nome: "Tiro Certeiro",
  elemento: "ar",
  custoMana: 10,
  recarga: 0.8,
  aoLancar(ctx) {
    const angulo = ctx.anguloParaInimigo();
    ctx.invocar({ tipo: "projetil", direcao: angulo, velocidade: 420, dano: 7 });
  },
});`,
    desafio: {
      enunciado: 'Cria uma <strong>variável</strong> (<code>const</code> ou <code>let</code>) que guarde o ângulo do inimigo e usa-a para disparar um projétil que o acerte.',
      codigoInicial: `feitico.definir({
  nome: "Mira Guardada",
  elemento: "ar",
  custoMana: 10,
  recarga: 0.8,
  aoLancar(ctx) {
    // 1. const angulo = ctx.anguloParaInimigo();
    // 2. usa "angulo" na direção do projétil
  },
});`,
      dica: 'const angulo = ctx.anguloParaInimigo(); e depois direcao: angulo',
    },
  },
  {
    id: 3,
    titulo: 'Condicionais',
    conceito: 'Decisões táticas com if',
    desbloqueia: 'feixe',
    teoria: `
      <p>Um feitiço inteligente <strong>decide</strong>. O <code>if</code> executa código só quando
      uma condição é verdadeira:</p>
      <pre>const dist = ctx.distanciaInimigo();
if (dist &lt; 150) {
  ctx.invocar({ tipo: "feixe", direcao: ctx.anguloMira(), dano: 12 });
} else {
  ctx.invocar({ tipo: "projetil", direcao: ctx.anguloParaInimigo(), dano: 7 });
}</pre>
      <p>O <strong>feixe</strong> acerta numa linha reta instantaneamente — devastador de perto,
      desperdício de longe. O projétil viaja — melhor para longe.</p>
      <p>Operadores úteis: <code>&lt;</code> menor, <code>&gt;</code> maior, <code>===</code> igual,
      <code>&amp;&amp;</code> e, <code>||</code> ou.</p>`,
    exemplo: `feitico.definir({
  nome: "Canihão Adaptável",
  elemento: "agua",
  custoMana: 16,
  recarga: 1.4,
  aoLancar(ctx) {
    const dist = ctx.distanciaInimigo();
    if (dist < 160) {
      ctx.invocar({ tipo: "feixe", direcao: ctx.anguloMira(), dano: 12 });
    } else {
      ctx.invocar({ tipo: "projetil", direcao: ctx.anguloParaInimigo(), velocidade: 420, dano: 7 });
    }
  },
});`,
    desafio: {
      enunciado: 'Escreve um feitiço com um <strong>if/else</strong>: se o inimigo estiver perto (&lt; 160) lança um <strong>feixe</strong>; senão lança um <strong>projétil</strong>. O teste lança em duas distâncias diferentes — ambos os caminhos têm de acertar.',
      codigoInicial: `feitico.definir({
  nome: "Tático",
  elemento: "ar",
  custoMana: 14,
  recarga: 1.2,
  aoLancar(ctx) {
    const dist = ctx.distanciaInimigo();
    // TODO: if (dist < 160) { ...feixe... } else { ...projetil... }
  },
});`,
      dica: 'Feixe: ctx.invocar({ tipo: "feixe", direcao: ctx.anguloMira(), dano: 12 })',
    },
  },
  {
    id: 4,
    titulo: 'Ciclos',
    conceito: 'Padrões com for',
    desbloqueia: 'area',
    teoria: `
      <p>O ciclo <code>for</code> repete código N vezes — perfeito para padrões de feitiços:</p>
      <pre>for (let i = 0; i &lt; 8; i++) {
  const angulo = (i / 8) * Math.PI * 2;
  ctx.invocar({ tipo: "projetil", direcao: angulo, dano: 5 });
}</pre>
      <p><code>i</code> vai de 0 a 7. Dividir por 8 e multiplicar por <code>Math.PI * 2</code>
      dá ângulos espaçados por igual — um <strong>círculo completo de mísseis</strong>.</p>
      <p>Cuidado: um ciclo <code>while (true)</code> sem fim esgota os passos do feitiço
      e o grimório estala!</p>`,
    exemplo: `feitico.definir({
  nome: "Flor de Fogo",
  elemento: "fogo",
  custoMana: 30,
  recarga: 3.2,
  aoLancar(ctx) {
    for (let i = 0; i < 8; i++) {
      ctx.invocar({
        tipo: "projetil",
        direcao: (i / 8) * Math.PI * 2 + ctx.anguloMira(),
        velocidade: 300,
        dano: 5,
      });
    }
  },
});`,
    desafio: {
      enunciado: 'Lança <strong>exatamente 8 projéteis</strong> dispostos num círculo completo usando um ciclo <code>for</code>. O teste conta as invocações!',
      codigoInicial: `feitico.definir({
  nome: "Círculo de Mísseis",
  elemento: "arcano",
  custoMana: 30,
  recarga: 3,
  aoLancar(ctx) {
    // TODO: for (let i = 0; i < 8; i++) { ... }
    // ângulo do passo i: (i / 8) * Math.PI * 2
  },
});`,
      dica: 'for (let i = 0; i < 8; i++) { ctx.invocar({ tipo: "projetil", direcao: (i / 8) * Math.PI * 2, dano: 5 }); }',
    },
  },
  {
    id: 5,
    titulo: 'Funções',
    conceito: 'Padrões reutilizáveis',
    desbloqueia: 'armadilha',
    teoria: `
      <p>Quando repetes o mesmo código, transforma-o numa <strong>função</strong>:</p>
      <pre>function dispararPar(base) {
  ctx.invocar({ tipo: "projetil", direcao: base - 0.2, dano: 6 });
  ctx.invocar({ tipo: "projetil", direcao: base + 0.2, dano: 6 });
}

dispararPar(ctx.anguloParaInimigo());
dispararPar(ctx.anguloParaInimigo() + Math.PI);</pre>
      <p>A função recebe um <em>parâmetro</em> (<code>base</code>) e é chamada duas vezes com
      valores diferentes — para a frente e para trás. Funções são a forma de dar
      <strong>nomes a padrões</strong> de magia.</p>`,
    exemplo: `feitico.definir({
  nome: "Estrela Dupla",
  elemento: "arcano",
  custoMana: 28,
  recarga: 2.6,
  aoLancar(ctx) {
    function dispararPar(base) {
      ctx.invocar({ tipo: "projetil", direcao: base - 0.18, velocidade: 400, dano: 6 });
      ctx.invocar({ tipo: "projetil", direcao: base + 0.18, velocidade: 400, dano: 6 });
    }
    dispararPar(ctx.anguloParaInimigo());
    dispararPar(ctx.anguloParaInimigo() + Math.PI / 2);
  },
});`,
    desafio: {
      enunciado: 'Cria uma <strong>função</strong> própria dentro do <code>aoLancar</code> que lance projéteis, e chama-a <strong>pelo menos duas vezes</strong> (mínimo 4 projéteis no total).',
      codigoInicial: `feitico.definir({
  nome: "Padrão Duplo",
  elemento: "fogo",
  custoMana: 28,
  recarga: 2.5,
  aoLancar(ctx) {
    function dispararPar(base) {
      ctx.invocar({ tipo: "projetil", direcao: base - 0.2, dano: 6 });
      ctx.invocar({ tipo: "projetil", direcao: base + 0.2, dano: 6 });
    }
    // TODO: chama dispararPar(...) duas vezes com ângulos diferentes
  },
});`,
      dica: 'dispararPar(ctx.anguloParaInimigo()); dispararPar(ctx.anguloParaInimigo() + Math.PI);',
    },
  },
  {
    id: 6,
    titulo: 'Vetores e Ângulos',
    conceito: 'Mira preditiva com trigonometria',
    desbloqueia: 'teleporte',
    teoria: `
      <p>Acertar num alvo em movimento exige <strong>prever onde ele vai estar</strong>.
      O truque: tempo de voo = distância ÷ velocidade.</p>
      <pre>const ini = ctx.inimigo();          // { x, y, vx, vy }
const eu = ctx.pos();
const dx = ini.x - eu.x, dy = ini.y - eu.y;
const dist = Math.hypot(dx, dy);    // pitágoras!
const vel = 400;                    // velocidade do teu projétil
const t = dist / vel;               // tempo de voo
const futuroX = ini.x + ini.vx * t; // onde ele vai estar
const futuroY = ini.y + ini.vy * t;
ctx.invocar({ tipo: "projetil",
  direcao: Math.atan2(futuroY - eu.y, futuroX - eu.x),
  velocidade: vel, dano: 8 });</pre>
      <p><code>Math.atan2(dy, dx)</code> converte uma direção cartesiana em ângulo.
      <code>Math.hypot</code> calcula a hipotenusa. Isto é trigonometria aplicada de verdade!</p>`,
    exemplo: `feitico.definir({
  nome: "Balestra Preditiva",
  elemento: "ar",
  custoMana: 12,
  recarga: 0.9,
  aoLancar(ctx) {
    const ini = ctx.inimigo();
    if (!ini) return;
    const eu = ctx.pos();
    const vel = 400;
    const dist = Math.hypot(ini.x - eu.x, ini.y - eu.y);
    const t = dist / vel;
    ctx.invocar({
      tipo: "projetil",
      direcao: Math.atan2(ini.y + ini.vy * t - eu.y, ini.x + ini.vx * t - eu.x),
      velocidade: vel,
      dano: 8,
    });
  },
});`,
    desafio: {
      enunciado: 'Cria um feitiço com <strong>mira preditiva</strong>: usa <code>ctx.inimigo()</code> (que dá <code>vx</code> e <code>vy</code>), a distância e <code>Math.atan2</code> para acertar num alvo que se move em linha reta.',
      codigoInicial: `feitico.definir({
  nome: "Mira Preditiva",
  elemento: "ar",
  custoMana: 12,
  recarga: 0.9,
  aoLancar(ctx) {
    const ini = ctx.inimigo();
    if (!ini) return;
    // TODO: previsão do futuro e Math.atan2(...)
  },
});`,
      dica: 't = dist / vel; direcao = Math.atan2(ini.y + ini.vy*t - eu.y, ini.x + ini.vx*t - eu.x)',
    },
  },
  {
    id: 7,
    titulo: 'Eventos',
    conceito: 'Feitiços reativos',
    desbloqueia: 'escudo',
    teoria: `
      <p>Feitiços podem <strong>reagir</strong> a acontecimentos do duelo. Cada projétil pode ter
      o seu próprio <code>aoAcertar(alvo)</code>:</p>
      <pre>ctx.invocar({
  tipo: "projetil",
  direcao: ctx.anguloParaInimigo(),
  dano: 8,
  aoAcertar(alvo) {
    alvo.aplicar("queimadura", { dps: 2, duracao: 3 });
  },
});</pre>
      <p>Outros eventos úteis: <code>aCadaTick(ctx)</code> (corre todos os ticks durante a
      duração ativa), <code>aoSerAcertado(ctx)</code>, <code>quandoVidaBaixa(ctx)</code>,
      <code>quandoInimigoPerto(ctx)</code> e <code>quandoInimigoLonge(ctx)</code>.</p>
      <p>Estados aplicáveis: <code>queimadura</code> (dano contínuo), <code>molhado</code>,
      <code>cego</code>, <code>lento</code>, <code>vento</code> (empurrão).</p>`,
    exemplo: `feitico.definir({
  nome: "Brasa Adesiva",
  elemento: "fogo",
  custoMana: 15,
  recarga: 1.6,
  aoLancar(ctx) {
    ctx.invocar({
      tipo: "projetil",
      direcao: ctx.anguloParaInimigo(),
      velocidade: 380,
      dano: 6,
      aoAcertar(alvo) {
        alvo.aplicar("queimadura", { dps: 3, duracao: 3 });
      },
    });
  },
});`,
    desafio: {
      enunciado: 'Lança um projétil com um hook <strong>aoAcertar(alvo)</strong> que aplique um estado ao alvo (ex.: <code>alvo.aplicar("queimadura", { dps: 2, duracao: 3 })</code>). O teste verifica se o estado fica ativo.',
      codigoInicial: `feitico.definir({
  nome: "Espinhos Reativos",
  elemento: "terra",
  custoMana: 15,
  recarga: 2,
  aoLancar(ctx) {
    ctx.invocar({
      tipo: "projetil",
      direcao: ctx.anguloParaInimigo(),
      dano: 8,
      // TODO: aoAcertar(alvo) { alvo.aplicar("lento", { duracao: 2 }); }
    });
  },
});`,
      dica: 'aoAcertar(alvo) { alvo.aplicar("queimadura", { dps: 2, duracao: 3 }); }',
    },
  },
  {
    id: 8,
    titulo: 'Otimização',
    conceito: 'Dano por mana — pensamento algorítmico',
    desbloqueia: 'aura',
    teoria: `
      <p>Um grande mago mede a <strong>eficiência</strong>: quanto dano por ponto de mana?
      </p>
      <pre>eficiência = dano total ÷ mana gasta</pre>
      <p>Estratégias:</p>
      <ul>
        <li>Estados como <code>queimadura</code> somam dano <em>depois</em> do impacto — dano quase grátis.</li>
        <li>Múltiplos projéteis baratos &gt; um único caro.</li>
        <li>Combina elementos: molhado + queimadura = vapor (dano extra).</li>
        <li>Baixo <code>custoMana</code> + alto <code>dano</code> + <code>recarga</code> curta.</li>
      </ul>
      <p>Isto é o início do <strong>pensamento algorítmico</strong>: otimizar um objetivo sujeito
      a restrições — exatamente como um programador otimiza memória ou tempo.</p>`,
    exemplo: `feitico.definir({
  nome: "Fornalha",
  elemento: "fogo",
  custoMana: 14,
  recarga: 2.0,
  aoLancar(ctx) {
    for (let i = 0; i < 3; i++) {
      ctx.invocar({
        tipo: "projetil",
        direcao: ctx.anguloParaInimigo() + (i - 1) * 0.12,
        velocidade: 420,
        dano: 8,
        aoAcertar(alvo) {
          alvo.aplicar("queimadura", { dps: 2, duracao: 2 });
        },
      });
    }
  },
});`,
    desafio: {
      enunciado: 'Cria um feitiço com <strong>eficiência ≥ 1.2</strong> (dano total ÷ mana gasta, medido em 3 lançamentos contra um alvo parado). Mantém <code>custoMana</code> entre 8 e 25.',
      codigoInicial: `feitico.definir({
  nome: "Eficiência Arcana",
  elemento: "fogo",
  custoMana: 20,   // baixa o custo, sobe o dano!
  recarga: 2.0,
  aoLancar(ctx) {
    // TODO: maximiza dano por mana
  },
});`,
      dica: '3 mísseis de dano 10 + queimadura dps 3 → ~39 dano por 20 mana = 1.95 de eficiência',
    },
  },
];
