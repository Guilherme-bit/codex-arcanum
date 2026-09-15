// Os 8 capítulos da Academia — escritos para quem NUNCA programou.
// Cada desafio é um "completa-a-linha": o código está quase todo feito e o aluno
// muda/acrecenta UMA coisa pequena de cada vez. Cada capítulo desbloqueia um
// componente novo da API. Verificação automática em academia/verificar.js.
export const LICOES = [
  {
    id: 1,
    titulo: 'O Teu Primeiro Feitiço',
    conceito: 'Chamar funções e dar ordens',
    desbloqueia: 'projetil',
    teoria: `
      <p><strong>Como funciona a Academia:</strong> à esquerda está a lição; à direita, o teu feitiço em código.
      Mudas uma coisa pequena, clicas <em>⚡ Verificar</em>, e o jogo testa o feitiço <strong>a valer</strong> — num duelo de treino verdadeiro, contra um alvo.</p>
      <p><strong>Um feitiço é uma receita que o jogo executa.</strong> Tu não apertas "atacar": escreves <em>como</em> atacar.
      A receita começa sempre assim:</p>
      <pre>feitico.definir({
  nome: "Faísca",     // o nome que aparece no slot
  elemento: "fogo",   // fogo, agua, terra, ar ou arcano
  custoMana: 10,      // quanto gasta de mana
  recarga: 0.8,       // segundos de espera entre lançamentos
  aoLancar(ctx) {     // o que acontece quando pressionas a tecla do slot
    // ← as tuas ordens vão aqui dentro
  },
});</pre>
      <p>Dentro de <code>aoLancar</code>, dás ordens ao mundo através de <code>ctx</code>.
      A ordem mais importante é <strong>invocar</strong>:</p>
      <pre>ctx.invocar({ tipo: "projetil", direcao: ctx.anguloParaInimigo(), dano: 8 });</pre>
      <p>Lê-se assim: "invoca um <strong>projétil</strong>, na <strong>direção</strong> do inimigo, com <strong>dano</strong> 8".
      As palavras dentro das chavetas são <em>argumentos</em> — os detalhes da ordem. Os ângulos vão em radianos, mas
      <code>ctx.anguloParaInimigo()</code> já te dá o ângulo certo, sempre que precisares.</p>
      <p class="dica-extra">💡 Nas partidas, os feitiços lançam-se com as teclas <strong>Q E R F C V</strong> (ou a roda do rato para escolher + clique).</p>
      <h3>📖 Palavras novas</h3>
      <ul>
        <li><code>feitico.definir({...})</code> — "definir" o teu feitiço (dar-lhe nome e poderes).</li>
        <li><code>ctx</code> — a tua ligação ao mundo: perguntas e ordens passam por aqui.</li>
        <li><code>ctx.invocar({...})</code> — invoca um componente mágico (projétil, feixe, área…).</li>
      </ul>`,
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
      enunciado: `A Faísca abaixo já está quase pronta — mas o <strong>dano</strong> está a <code>0</code>, ou seja, não faz nada!
<strong>1.</strong> Encontra a linha <code>dano: 0,</code><br/>
<strong>2.</strong> Muda o <code>0</code> para <code>8</code><br/>
<strong>3.</strong> Clica <strong>⚡ Verificar</strong>. É só isto — bem-vindo à Academia!`,
      codigoInicial: `feitico.definir({
  nome: "Faísca",
  elemento: "fogo",
  custoMana: 10,
  recarga: 0.8,
  aoLancar(ctx) {
    ctx.invocar({
      tipo: "projetil",
      direcao: ctx.anguloParaInimigo(),
      dano: 0,   // ← 1. muda o 0 para 8 (o dano da Faísca)
    });
  },
});`,
      dica: 'Na linha dano: 0, apaga o 0 e escreve 8. Fica: dano: 8,',
    },
  },
  {
    id: 2,
    titulo: 'Potes com Etiquetas',
    conceito: 'Variáveis: guardar e reutilizar valores',
    desbloqueia: 'dash',
    teoria: `
      <p>Imagina potes com etiquetas: guardas um valor num <strong>pote</strong>, colas uma <strong>etiqueta</strong>,
      e a partir daí usas o nome do pote em vez do valor. Em JavaScript os potes chamam-se <strong>variáveis</strong>:</p>
      <pre>const angulo = ctx.anguloParaInimigo();</pre>
      <p>Lê-se: "cria um pote chamado <code>angulo</code> (com <code>const</code> = constante, um pote que não muda)
      e guarda lá o ângulo até ao inimigo." A partir daqui, onde escreveres <code>angulo</code>, o JavaScript
      vai buscar o valor guardado:</p>
      <pre>ctx.invocar({ tipo: "projetil", direcao: angulo, dano: 6 });</pre>
      <p>Porquê incomodar-se? Três razões: <strong>1)</strong> o valor fica calculado uma única vez;
      <strong>2)</strong> o código lê-se como uma frase; <strong>3)</strong> quando dominares, vais usar o mesmo pote
      para fazer coisas como <code>angulo + 0.3</code> — "o ângulo, um bocadinho à direita".</p>
      <h3>📖 Palavras novas</h3>
      <ul>
        <li><code>const</code> — cria um pote com etiqueta fixa (o mais usado).</li>
        <li><code>let</code> — igual, mas para valores que vão mudar (veremos mais tarde).</li>
        <li><code>=</code> — "guarda o que está à direita dentro do pote à esquerda".</li>
      </ul>`,
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
      enunciado: `O feitiço abaixo já tem o pote criado — o ângulo certo está guardado em <code>angulo</code>.
Mas o projétil aponta para uma direção fixa (<code>direcao: 0</code> = sempre para a direita)!<br/>
<strong>1.</strong> Na linha <code>direcao: 0,</code><br/>
<strong>2.</strong> Troca o <code>0</code> por <code>angulo</code> (o teu pote!)<br/>
<strong>3.</strong> ⚡ Verificar.`,
      codigoInicial: `feitico.definir({
  nome: "Tiro do Pote",
  elemento: "ar",
  custoMana: 10,
  recarga: 0.8,
  aoLancar(ctx) {
    const angulo = ctx.anguloParaInimigo(); // o pote já tem o ângulo
    ctx.invocar({
      tipo: "projetil",
      direcao: 0, // ← 1. troca o 0 por: angulo
      velocidade: 420,
      dano: 8,
    });
  },
});`,
      dica: 'Substitui o 0 da direcao por angulo. Fica: direcao: angulo,',
    },
  },
  {
    id: 3,
    titulo: 'A Encruzilhada',
    conceito: 'Condicionais: decisões com if/else',
    desbloqueia: 'feixe',
    teoria: `
      <p>Um feitiço esperto <strong>decide</strong> sozinho. O <code>if</code> é uma encruzilhada:
      "SE isto for verdade, faz A; SENÃO, faz B":</p>
      <pre>if (dist &lt; 160) {
  // caminho da esquerda: só corre quando a condição é verdadeira
} else {
  // caminho da direita: corre em todos os outros casos
}</pre>
      <p>As condições comparam valores: <code>&lt;</code> menor, <code>&gt;</code> maior, <code>===</code> igual,
      <code>&amp;&amp;</code> "e também", <code>||</code> "ou".</p>
      <p><strong>Porquê isto num duelo?</strong> Cada arma serve uma distância: o <strong>feixe</strong>
      acerta numa linha instantânea — mortal de perto, desperdício de longe. O <strong>projétil</strong> viaja —
      ideal de longe. Um bom feitiço escolhe sozinho!</p>
      <h3>📖 Palavras novas</h3>
      <ul>
        <li><code>if (...) { }</code> — "se… então faz isto".</li>
        <li><code>else { }</code> — "senão, faz aquilo".</li>
        <li><code>ctx.distanciaInimigo()</code> — pergunta ao mundo: a que distância está o inimigo?</li>
      </ul>`,
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
      enunciado: `O feitiço abaixo só tem o feixe — e curto demais. De longe, nem chega ao alvo!<br/>
<strong>1.</strong> Envolbe a linha do feixe num <code>if (dist &lt; 160) { ... }</code><br/>
<strong>2.</strong> Acrescente um <code>else { ... }</code> com um <strong>projétil</strong> para longe<br/>
(o exemplo ao lado do "Ver exemplo" mostra a forma exata — o teu é quase igual).`,
      codigoInicial: `feitico.definir({
  nome: "Encruzilhada",
  elemento: "agua",
  custoMana: 14,
  recarga: 1.2,
  aoLancar(ctx) {
    const dist = ctx.distanciaInimigo();
    // TODO: 1. se (dist < 160) → feixe; 2. senão → projétil
    ctx.invocar({ tipo: "feixe", direcao: ctx.anguloMira(), alcance: 300, dano: 12 });
  },
});`,
      dica: 'if (dist < 160) { ctx.invocar({ tipo: "feixe", direcao: ctx.anguloMira(), dano: 12 }); } else { ctx.invocar({ tipo: "projetil", direcao: ctx.anguloParaInimigo(), velocidade: 420, dano: 7 }); }',
    },
  },
  {
    id: 4,
    titulo: 'O Eco',
    conceito: 'Ciclos: repetir sem repetir',
    desbloqueia: 'area',
    teoria: `
      <p>Queres 8 mísseis? Podias escrever <code>ctx.invocar(...)</code> oito vezes… ou usar um <strong>ciclo</strong>
      que repete a ordem por ti:</p>
      <pre>for (let i = 0; i &lt; 8; i++) {
  // isto repete 8 vezes, com i = 0, 1, 2, … 7
}</pre>
      <p>Lê-se: "para <code>i</code> a começar em 0, enquanto <code>i &lt; 8</code>, repete e soma 1 a <code>i</code>".
      O truque mágico: usar o próprio <code>i</code> para variar cada repetição. Dividir o círculo em 8 fatias:</p>
      <pre>const angulo = (i / 8) * Math.PI * 2;</pre>
      <p><code>Math.PI * 2</code> é a volta completa (360° em radianos). <code>i/8</code> dá 0, 0.125, 0.25…
      — 8 fatias iguais de bolo. Resultado: um <strong>círculo de mísseis</strong> com 3 linhas de código.</p>
      <p>⚠️ Cuidado: <code>while (true)</code> sem fim esgota os passos do feitiço e o grimório estala. O <code>for</code> tem sempre fim.</p>
      <h3>📖 Palavras novas</h3>
      <ul>
        <li><code>for (let i = 0; i &lt; N; i++)</code> — repete N vezes, contando com <code>i</code>.</li>
        <li><code>i++</code> — soma 1 ao <code>i</code> a cada volta.</li>
        <li><code>Math.PI</code> — o famoso π, disponível dentro dos feitiços.</li>
      </ul>`,
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
      enunciado: `O ciclo abaixo só lança <strong>1 míssil</strong> — precisamos de um círculo com <strong>8</strong>!<br/>
<strong>1.</strong> Na linha do <code>for</code>, muda o <code>1</code> para <code>8</code><br/>
(O resto já está feito — o ângulo de cada fatia já usa o <code>i</code>.)`,
      codigoInicial: `feitico.definir({
  nome: "Círculo de Mísseis",
  elemento: "arcano",
  custoMana: 30,
  recarga: 3,
  aoLancar(ctx) {
    for (let i = 0; i < 1; i++) {  // ← 1. muda o 1 para 8
      ctx.invocar({
        tipo: "projetil",
        direcao: (i / 8) * Math.PI * 2,
        velocidade: 300,
        dano: 5,
      });
    }
  },
});`,
      dica: 'Muda i < 1 para i < 8 na linha do for.',
    },
  },
  {
    id: 5,
    titulo: 'Feitiços Dentro de Feitiços',
    conceito: 'Funções: dar nome a um padrão',
    desbloqueia: 'armadilha',
    teoria: `
      <p>Quando repetes o mesmo bloco de magia, dá-lhe um <strong>nome</strong>: cria uma <strong>função</strong>.
      É um feitiço dentro do teu feitiço:</p>
      <pre>function dispararPar(base) {
  ctx.invocar({ tipo: "projetil", direcao: base - 0.2, dano: 6 });
  ctx.invocar({ tipo: "projetil", direcao: base + 0.2, dano: 6 });
}</pre>
      <p>A função fica <em>à espera</em>. Só atua quando a <strong>chamas</strong>, dando o valor do
      <em>parâmetro</em> <code>base</code>:</p>
      <pre>dispararPar(ctx.anguloParaInimigo());      // para a frente
dispararPar(ctx.anguloParaInimigo() + Math.PI);  // e para trás!</pre>
      <p>Isto é a base de todos os programas grandes: peças pequenas com nomes, combinadas em peças maiores.
      Magos antigos chamavam-lhe "encantamentos secundários". Os programadores chamam-lhe terça-feira.</p>
      <h3>📖 Palavras novas</h3>
      <ul>
        <li><code>function nome(parametro) { }</code> — declara um encantamento secundário.</li>
        <li><code>nome(valor)</code> — <em>chama</em> a função (executa-a com esse valor).</li>
        <li><code>Math.PI</code> — meia volta; somá-lo a um ângulo inverte a direção.</li>
      </ul>`,
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
      enunciado: `A função <code>dispararPar</code> já existe abaixo — mas ninguém a chama! Está adormecida.<br/>
<strong>1.</strong> No fim do <code>aoLancar</code>, escreve:<br/>
<code>dispararPar(ctx.anguloParaInimigo());</code><br/>
<code>dispararPar(ctx.anguloParaInimigo() + Math.PI);</code><br/>
<strong>2.</strong> ⚡ Verificar — e conta os projéteis: 4!`,
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
    // ← 1. chama dispararPar duas vezes:
    //    para o inimigo e para a direção oposta (+ Math.PI)
  },
});`,
      dica: 'Escreve: dispararPar(ctx.anguloParaInimigo()); e por baixo dispararPar(ctx.anguloParaInimigo() + Math.PI);',
    },
  },
  {
    id: 6,
    titulo: 'O Olho do Futuro',
    conceito: 'Vetores e ângulos: mira preditiva',
    desbloqueia: 'teleporte',
    teoria: `
      <p>Acertar em quem se move é <strong>prever o futuro</strong>. E o futuro calcula-se:</p>
      <p><strong>1. Quanto tempo voa o projétil?</strong> Tempo = distância ÷ velocidade.</p>
      <pre>const dist = Math.hypot(ini.x - eu.x, ini.y - eu.y); // pitágoras!
const t = dist / vel;</pre>
      <p><strong>2. Onde estará o alvo daqui a <code>t</code> segundos?</strong> Posição atual + velocidade × tempo:</p>
      <pre>const futuroX = ini.x + ini.vx * t;
const futuroY = ini.y + ini.vy * t;</pre>
      <p><strong>3. Apontar ao futuro.</strong> <code>Math.atan2(dy, dx)</code> converte uma direção (dx, dy) num ângulo:</p>
      <pre>direcao: Math.atan2(futuroY - eu.y, futuroX - eu.x)</pre>
      <p><code>ctx.inimigo()</code> dá-te <code>{ x, y, vx, vy, ... }</code> — as letras <code>v</code> são as
      <strong>velocidades</strong> (quanto se move por segundo em cada eixo). É trigonometria de verdade, a ganhar duelos.</p>
      <h3>📖 Palavras novas</h3>
      <ul>
        <li><code>Math.hypot(a, b)</code> — hipotenusa (a distância em linha reta).</li>
        <li><code>Math.atan2(dy, dx)</code> — converte uma direção num ângulo.</li>
        <li><code>ini.vx, ini.vy</code> — velocidade do inimigo em cada eixo.</li>
      </ul>`,
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
      enunciado: `A Balestra abaixo já sabe prever o futuro — menos uma coisa: a <strong>velocidade</strong> do projétil
está a <code>0</code> (não se divide por zero!).<br/>
<strong>1.</strong> Nas duas linhas com <code>vel</code>, muda <code>0</code> para <code>400</code><br/>
<strong>2.</strong> ⚡ Verificar — o alvo de teste está em movimento. Só uma mira que vê o futuro o alcança.`,
      codigoInicial: `feitico.definir({
  nome: "Olho do Futuro",
  elemento: "ar",
  custoMana: 12,
  recarga: 0.9,
  aoLancar(ctx) {
    const ini = ctx.inimigo();
    if (!ini) return;
    const eu = ctx.pos();
    const vel = 0; // ← 1. experimenta 400
    const dist = Math.hypot(ini.x - eu.x, ini.y - eu.y);
    const t = dist / vel;
    ctx.invocar({
      tipo: "projetil",
      direcao: Math.atan2(ini.y + ini.vy * t - eu.y, ini.x + ini.vx * t - eu.x),
      velocidade: vel, // ← 2. e aqui também 400
      dano: 8,
    });
  },
});`,
      dica: 'Nas duas linhas onde está vel = 0, escreve vel = 400. A matemática do futuro já está toda feita.',
    },
  },
  {
    id: 7,
    titulo: 'Feitiços que Reagem',
    conceito: 'Eventos: aoAcertar e companhia',
    desbloqueia: 'escudo',
    teoria: `
      <p>Até agora os teus feitiços <em>agem</em>. A partir de agora podem <strong>reagir</strong>.
      Cada projétil pode levar o próprio hook <code>aoAcertar(alvo)</code> — um código que corre quando o
      projétil toca alguém:</p>
      <pre>ctx.invocar({
  tipo: "projetil",
  direcao: ctx.anguloParaInimigo(),
  dano: 8,
  aoAcertar(alvo) {
    alvo.aplicar("queimadura", { dps: 2, duracao: 3 });
  },
});</pre>
      <p>O <code>alvo</code> é quem foi atingido. <code>alvo.aplicar(estado, opções)</code> cola-lhe um estado:
      <code>queimadura</code> (dano contínuo), <code>molhado</code>, <code>cego</code>, <code>lento</code>,
      <code>vento</code> (empurrão). Outros hooks de feitiço: <code>aCadaTick(ctx)</code>,
      <code>quandoVidaBaixa(ctx)</code>, <code>quandoInimigoPerto(ctx)</code>, <code>quandoInimigoLonge(ctx)</code>.</p>
      <p><strong>Sinergias</strong> — o segredo dos grandes magos: <em>molhado + queimadura = vapor que cega</em>;
      <em>vento + fogo = explosão</em>. Experimenta no Tomo o feitiço "Câmara de Vapor".</p>
      <h3>📖 Palavras novas</h3>
      <ul>
        <li><code>aoAcertar(alvo) { }</code> — código que corre no impacto.</li>
        <li><code>alvo.aplicar(estado, { dps, duracao })</code> — aplica um estado ao alvo.</li>
        <li><code>hook</code> — "gancho": uma função que o jogo chama quando algo acontece.</li>
      </ul>`,
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
      enunciado: `O feitiço abaixo lança um projétil… que não deixa nada atrás de si. O hook
<code>aoAcertar</code> está lá — mas <em>comentado</em> (as linhas começam por <code>//</code>, e o jogo ignora-as).<br/>
<strong>1.</strong> Apaga os <code>// </code> nas 3 linhas do <code>aoAcertar</code> para as "descomentar"<br/>
<strong>2.</strong> ⚡ Verificar — o impacto deve deixar queimadura.`,
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
      // aoAcertar(alvo) {
      //   alvo.aplicar("queimadura", { dps: 2, duracao: 3 });
      // },
    });
  },
});`,
      dica: 'Apaga os // no início das 3 linhas aoAcertar / alvo.aplicar / },. Comentários (//) são ignorados pelo jogo.',
    },
  },
  {
    id: 8,
    titulo: 'A Arte da Eficiência',
    conceito: 'Otimização: máximo dano por mana',
    desbloqueia: 'aura',
    teoria: `
      <p>A última lição muda a pergunta. Até agora: <em>"como funciona?"</em>. Agora: <em>"como funciona
      <strong>melhor</strong>?"</em>. Medimos assim:</p>
      <pre>eficiência = dano total ÷ mana gasta</pre>
      <p><strong>Três segredos de otimização:</strong></p>
      <ul>
        <li><strong>Projéteis que falham são mana no lixo.</strong> Um leque largo de 3 mísseis à distância
        pode acertar com 1 — os outros dois evaporaram a tua mana. Às vezes <em>juntar</em> os tiros bate <em>espalhar</em>.</li>
        <li><strong>Estados são dano quase grátis.</strong> <code>queimadura</code> continua a ferir depois do
        impacto, sem gastar mais mana.</li>
        <li><strong>Mede, não adivinhes.</strong> Usa o ⚡ Verificar: ele mede a tua eficiência a valer.</li>
      </ul>
      <p>Isto é <strong>pensamento algorítmico</strong>: melhorar uma solução medida contra um objetivo —
      a habilidade que separa quem escreve código de quem <em>engenharia</em> código.</p>
      <h3>📖 Para recordar</h3>
      <ul>
        <li>Leques espalham — e o alvo só ocupa um ângulo pequeno.</li>
        <li><code>efeitos: [{ estado: "queimadura", dps: N, duracao: N }]</code> — dano atrasado barato.</li>
        <li>O objetivo: eficiência ≥ 1.2 (dano total ÷ mana gasta, em 3 lançamentos).</li>
      </ul>`,
    exemplo: `feitico.definir({
  nome: "Fornalha",
  elemento: "fogo",
  custoMana: 14,
  recarga: 2.0,
  aoLancar(ctx) {
    for (let i = 0; i < 3; i++) {
      ctx.invocar({
        tipo: "projetil",
        direcao: ctx.anguloParaInimigo() + (i - 1) * 0.03,
        velocidade: 420,
        dano: 8,
        efeitos: [{ estado: "queimadura", dps: 2, duracao: 2 }],
      });
    }
  },
});`,
    desafio: {
      enunciado: `A "Metralhora" abaixo dispara um leque largo — mas à distância só <strong>1 em 3</strong> projéteis
acerta. A mana dos outros dois evaporou!<br/>
<strong>1.</strong> Reduz a separação do leque de <code>0.1</code> para <code>0.03</code> (tiros juntos = todos acertam)<br/>
<strong>2.</strong> Sobe o <code>dano</code> de <code>6</code> para pelo menos <code>8</code><br/>
<strong>3.</strong> ⚡ Verificar e olha ao número de <strong>eficiência</strong> no relatório. Consegue 1.2+?`,
      codigoInicial: `feitico.definir({
  nome: "Metralhora",
  elemento: "fogo",
  custoMana: 20,
  recarga: 2.0,
  aoLancar(ctx) {
    for (let i = 0; i < 3; i++) {
      ctx.invocar({
        tipo: "projetil",
        direcao: ctx.anguloParaInimigo() + (i - 1) * 0.1, // ← 1. 0.1 junta demais… experimenta 0.03
        velocidade: 420,
        dano: 6,                                          // ← 2. sobe para 8 ou mais
        efeitos: [{ estado: "queimadura", dps: 2, duracao: 2 }],
      });
    }
  },
});`,
      dica: 'Muda (i - 1) * 0.1 para (i - 1) * 0.03 e dano: 6 para dano: 8. Depois olha à eficiência no relatório.',
    },
  },
];
