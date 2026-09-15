// ─────────────────────────────────────────────────────────────────────────────
// O Tomo da Biblioteca — feitiços de exemplo organizados por dificuldade
// de PROGRAMAÇÃO (não de poder). Estrutura pensada para crescer para centenas:
// basta acrescentar objetos a um tier.
// Feitiços copiados daqui chegam com Tinta de Treino (ver perfil.js).
// ─────────────────────────────────────────────────────────────────────────────

export const TIERS = [
  { id: 'iniciante',   nome: 'Iniciado',    cor: '#7bffb2', descricao: 'Uma ou duas linhas. O teu primeiro passo.' },
  { id: 'aventureiro', nome: 'Aventureiro', cor: '#7cc4ff', descricao: 'Variáveis, condicionais e pequenos padrões.' },
  { id: 'mestre',      nome: 'Mestre',      cor: '#ffd166', descricao: 'Ciclos, funções próprias e sinergias.' },
  { id: 'arcano',      nome: 'Arcano',      cor: '#c77dff', descricao: 'Eventos, trigonometria e feitiços que pensam.' },
];

export const BIBLIOTECA = [
  // ── INICIADO — uma ou duas linhas de código ────────────────────────────────
  {
    id: 'faisca', nome: 'Faísca', tier: 'iniciante',
    conceito: 'Uma chamada de função',
    descricao: 'Um projétil simples na direção do inimigo. Fraco, mas nunca falha.',
    codigo: `feitico.definir({
  nome: "Faísca",
  elemento: "arcano",
  custoMana: 8,
  recarga: 0.7,
  aoLancar(ctx) {
    ctx.invocar({ tipo: "projetil", direcao: ctx.anguloParaInimigo(), dano: 5 });
  },
});`,
  },
  {
    id: 'sopro', nome: 'Sopro Gélido', tier: 'iniciante',
    conceito: 'Um componente diferente: o feixe',
    descricao: 'Um raio instantâneo curto. Aprende o componente "feixe".',
    codigo: `feitico.definir({
  nome: "Sopro Gélido",
  elemento: "agua",
  custoMana: 10,
  recarga: 1.2,
  aoLancar(ctx) {
    ctx.invocar({ tipo: "feixe", direcao: ctx.anguloMira(), alcance: 260, dano: 7 });
  },
});`,
  },
  {
    id: 'pedrada', nome: 'Pedrada', tier: 'iniciante',
    conceito: 'Argumentos mudam tudo',
    descricao: 'Lento mas doloroso. O mesmo componente "projetil", números diferentes.',
    codigo: `feitico.definir({
  nome: "Pedrada",
  elemento: "terra",
  custoMana: 14,
  recarga: 1.5,
  aoLancar(ctx) {
    ctx.invocar({ tipo: "projetil", direcao: ctx.anguloParaInimigo(), velocidade: 240, dano: 11, raio: 10 });
  },
});`,
  },
  {
    id: 'brisa', nome: 'Brisa', tier: 'iniciante',
    conceito: 'Estados: empurrar com vento',
    descricao: 'Não mata — empurra. Ideal para ganhar espaço.',
    codigo: `feitico.definir({
  nome: "Brisa",
  elemento: "ar",
  custoMana: 10,
  recarga: 1.6,
  aoLancar(ctx) {
    ctx.invocar({
      tipo: "projetil", direcao: ctx.anguloParaInimigo(), velocidade: 460, dano: 3,
      efeitos: [{ estado: "vento", forca: 200, duracao: 2 }],
    });
  },
});`,
  },
  {
    id: 'casca', nome: 'Casca de Pedra', tier: 'iniciante',
    conceito: 'Um feitiço que não ataca',
    descricao: 'Um escudo pequeno. Às vezes a melhor magia é aguentar.',
    codigo: `feitico.definir({
  nome: "Casca de Pedra",
  elemento: "terra",
  custoMana: 18,
  recarga: 5,
  aoLancar(ctx) {
    ctx.escudo({ vida: 30 });
  },
});`,
  },
  {
    id: 'piso', nome: 'Piso Firme', tier: 'iniciante',
    conceito: 'Área à tua volta',
    descricao: 'Uma onda pequena que castiga quem se cola a ti.',
    codigo: `feitico.definir({
  nome: "Piso Firme",
  elemento: "terra",
  custoMana: 16,
  recarga: 2.8,
  aoLancar(ctx) {
    ctx.invocar({ tipo: "area", centro: "eu", raio: 85, dano: 8 });
  },
});`,
  },

  // ── AVENTUREIRO — variáveis, if, padrões simples ──────────────────────────
  {
    id: 'leque', nome: 'Leque de Aço', tier: 'aventureiro',
    conceito: 'Um ciclo "for" com três passos',
    descricao: 'Três projéteis em leque. Difícil de esquivar por inteiro.',
    codigo: `feitico.definir({
  nome: "Leque de Aço",
  elemento: "ar",
  custoMana: 20,
  recarga: 2.2,
  aoLancar(ctx) {
    for (let i = -1; i <= 1; i++) {
      ctx.invocar({ tipo: "projetil", direcao: ctx.anguloParaInimigo() + i * 0.2, dano: 5 });
    }
  },
});`,
  },
  {
    id: 'lanca', nome: 'Lança Perfurante', tier: 'aventureiro',
    conceito: 'Uma variável para guardar o ângulo',
    descricao: 'Rápida e direita. Guarda o ângulo numa variável e usa-o.',
    codigo: `feitico.definir({
  nome: "Lança Perfurante",
  elemento: "ar",
  custoMana: 15,
  recarga: 1.3,
  aoLancar(ctx) {
    const angulo = ctx.anguloParaInimigo();
    ctx.invocar({ tipo: "projetil", direcao: angulo, velocidade: 560, dano: 9, raio: 5 });
  },
});`,
  },
  {
    id: 'prisao', nome: 'Prisão de Terra', tier: 'aventureiro',
    conceito: 'Armadilhas na mira do adversário',
    descricao: 'Enterra uma armadilha perto de onde apontas. Controla o terreno.',
    codigo: `feitico.definir({
  nome: "Prisão de Terra",
  elemento: "terra",
  custoMana: 18,
  recarga: 3.5,
  aoLancar(ctx) {
    ctx.invocar({
      tipo: "armadilha", direcao: ctx.anguloMira(), distancia: 150,
      raio: 42, dano: 12,
      efeitos: [{ estado: "lento", duracao: 2.5 }],
    });
  },
});`,
  },
  {
    id: 'mare', nome: 'Maré Dupla', tier: 'aventureiro',
    conceito: 'Duas invocações em sequência',
    descricao: 'Primeiro molha, depois bate. Prepara a sinergia do vapor.',
    codigo: `feitico.definir({
  nome: "Maré Dupla",
  elemento: "agua",
  custoMana: 24,
  recarga: 2.6,
  aoLancar(ctx) {
    ctx.invocar({ tipo: "feixe", direcao: ctx.anguloMira(), dano: 6, efeitos: [{ estado: "molhado", duracao: 3 }] });
    ctx.invocar({ tipo: "projetil", direcao: ctx.anguloParaInimigo(), dano: 8 });
  },
});`,
  },
  {
    id: 'guardo', nome: 'Sentinela Nervosa', tier: 'aventureiro',
    conceito: 'Condicional: reage à distância',
    descricao: 'Feixe se estiver perto, projétil se estiver longe.',
    codigo: `feitico.definir({
  nome: "Sentinela Nervosa",
  elemento: "ar",
  custoMana: 16,
  recarga: 1.6,
  aoLancar(ctx) {
    if (ctx.distanciaInimigo() < 170) {
      ctx.invocar({ tipo: "feixe", direcao: ctx.anguloMira(), dano: 12 });
    } else {
      ctx.invocar({ tipo: "projetil", direcao: ctx.anguloParaInimigo(), velocidade: 430, dano: 7 });
    }
  },
});`,
  },
  {
    id: 'estilha', nome: 'Estilhaços', tier: 'aventureiro',
    conceito: 'Função própria reutilizada',
    descricao: 'Uma função dispara dois projéteis; chamada duas vezes, quatro projéteis.',
    codigo: `feitico.definir({
  nome: "Estilhaços",
  elemento: "terra",
  custoMana: 26,
  recarga: 2.8,
  aoLancar(ctx) {
    function par(base) {
      ctx.invocar({ tipo: "projetil", direcao: base - 0.16, dano: 5 });
      ctx.invocar({ tipo: "projetil", direcao: base + 0.16, dano: 5 });
    }
    par(ctx.anguloParaInimigo());
    par(ctx.anguloParaInimigo() + Math.PI);
  },
});`,
  },

  // ── MESTRE — ciclos completos, sinergias, composição ──────────────────────
  {
    id: 'tormenta', nome: 'Tormenta Menor', tier: 'mestre',
    conceito: 'Círculo completo com um ciclo',
    descricao: 'Oito mísseis em todas as direções. Impossível escapar por pouco.',
    codigo: `feitico.definir({
  nome: "Tormenta Menor",
  elemento: "arcano",
  custoMana: 30,
  recarga: 3.2,
  aoLancar(ctx) {
    for (let i = 0; i < 8; i++) {
      ctx.invocar({ tipo: "projetil", direcao: (i / 8) * Math.PI * 2, dano: 5, velocidade: 300 });
    }
  },
});`,
  },
  {
    id: 'combustao', nome: 'Combustão', tier: 'mestre',
    conceito: 'Estados que continuam a ferir',
    descricao: 'O impacto dói; a queimadura continua a morder durante 4 segundos.',
    codigo: `feitico.definir({
  nome: "Combustão",
  elemento: "fogo",
  custoMana: 22,
  recarga: 2.4,
  aoLancar(ctx) {
    ctx.invocar({
      tipo: "projetil", direcao: ctx.anguloParaInimigo(), velocidade: 400, dano: 8,
      efeitos: [{ estado: "queimadura", dps: 3, duracao: 4 }],
    });
  },
});`,
  },
  {
    id: 'vapor', nome: 'Câmara de Vapor', tier: 'mestre',
    conceito: 'Sinergia: molhado + queimadura = vapor',
    descricao: 'Molha a área e deita fogo a seguir — o vapor cega o alvo.',
    codigo: `feitico.definir({
  nome: "Câmara de Vapor",
  elemento: "agua",
  custoMana: 32,
  recarga: 4,
  aoLancar(ctx) {
    ctx.invocar({ tipo: "area", centro: "mira", raio: 90, dano: 6, efeitos: [{ estado: "molhado", duracao: 3 }] });
    ctx.invocar({ tipo: "area", centro: "mira", raio: 90, dano: 8, efeitos: [{ estado: "queimadura", dps: 2, duracao: 3 }] });
  },
});`,
  },
  {
    id: 'rugido', nome: 'Rugido da Montanha', tier: 'mestre',
    conceito: 'Área grande + controlo',
    descricao: 'Um trovão largo que retarda quem se aproxima.',
    codigo: `feitico.definir({
  nome: "Rugido da Montanha",
  elemento: "terra",
  custoMana: 28,
  recarga: 3.8,
  aoLancar(ctx) {
    ctx.invocar({
      tipo: "area", centro: "eu", raio: 140, dano: 12,
      efeitos: [{ estado: "lento", duracao: 2.5 }],
    });
  },
});`,
  },
  {
    id: 'helice', nome: 'Hélice de Aço', tier: 'mestre',
    conceito: 'Função + ciclo juntos',
    descricao: 'Quatro rajadas cruzadas em duas rodas de três mísseis.',
    codigo: `feitico.definir({
  nome: "Hélice de Aço",
  elemento: "ar",
  custoMana: 34,
  recarga: 3.6,
  aoLancar(ctx) {
    function rajada(base) {
      for (let i = -1; i <= 1; i++) {
        ctx.invocar({ tipo: "projetil", direcao: base + i * 0.14, dano: 5, velocidade: 420 });
      }
    }
    rajada(ctx.anguloParaInimigo() - 0.5);
    rajada(ctx.anguloParaInimigo() + 0.5);
  },
});`,
  },
  {
    id: 'sombras', nome: 'Passo das Sombras', tier: 'mestre',
    conceito: 'Mobilidade + utilidade num só feitiço',
    descricao: 'Teleporta-te para longe e deixa uma armadilha onde estavas.',
    codigo: `feitico.definir({
  nome: "Passo das Sombras",
  elemento: "arcano",
  custoMana: 26,
  recarga: 5,
  aoLancar(ctx) {
    ctx.invocar({ tipo: "armadilha", direcao: ctx.anguloMira() + Math.PI, distancia: 40, raio: 40, dano: 12 });
    ctx.teleporte({ distancia: 220, direcao: ctx.anguloMira() + Math.PI });
  },
});`,
  },

  // ── ARCANO — eventos, trigonometria, feitiços que pensam ─────────────────
  {
    id: 'oracular', nome: 'Mira Oracular', tier: 'arcano',
    conceito: 'Trigonometria: acertar no FUTURO',
    descricao: 'Prevê onde o alvo vai estar (tempo de voo) e acerta lá. O feitiço dos capítulos 6 e 8.',
    codigo: `feitico.definir({
  nome: "Mira Oracular",
  elemento: "ar",
  custoMana: 16,
  recarga: 1.4,
  aoLancar(ctx) {
    const ini = ctx.inimigo();
    if (!ini) return;
    const eu = ctx.pos();
    const vel = 460;
    const dist = Math.hypot(ini.x - eu.x, ini.y - eu.y);
    const t = dist / vel;
    ctx.invocar({
      tipo: "projetil",
      direcao: Math.atan2(ini.y + ini.vy * t - eu.y, ini.x + ini.vx * t - eu.x),
      velocidade: vel, dano: 11,
    });
  },
});`,
  },
  {
    id: 'espinhos', nome: 'Espinhos Vivos', tier: 'arcano',
    conceito: 'aoAcertar: o projétil reage ao impacto',
    descricao: 'Cada impacto deixa queimadura e empurra o alvo de volta.',
    codigo: `feitico.definir({
  nome: "Espinhos Vivos",
  elemento: "fogo",
  custoMana: 24,
  recarga: 2.6,
  aoLancar(ctx) {
    for (let i = -1; i <= 1; i++) {
      ctx.invocar({
        tipo: "projetil", direcao: ctx.anguloParaInimigo() + i * 0.18, dano: 6,
        aoAcertar(alvo) {
          alvo.aplicar("queimadura", { dps: 2, duracao: 3 });
          alvo.empurrar(ctx.anguloParaInimigo(), 90);
        },
      });
    }
  },
});`,
  },
  {
    id: 'enxame', nome: 'Enxame Errante', tier: 'arcano',
    conceito: 'aCadaTick: um feitiço que vive durante segundos',
    descricao: 'Durante 4 segundos dispara mísseis sozinho, de forma errante.',
    codigo: `feitico.definir({
  nome: "Enxame Errante",
  elemento: "arcano",
  custoMana: 36,
  recarga: 5,
  duracaoAtiva: 4,
  aoLancar(ctx) { /* o enxame arranca */ },
  aCadaTick(ctx) {
    if (ctx.aleatorio() < 0.08) {
      ctx.invocar({
        tipo: "projetil",
        direcao: ctx.anguloParaInimigo() + (ctx.aleatorio() - 0.5) * 0.4,
        velocidade: 360, dano: 5,
      });
    }
  },
});`,
  },
  {
    id: 'duelista', nome: 'Duelista', tier: 'arcano',
    conceito: 'Tudo junto: condição + previsão + estados',
    descricao: 'De perto um feixe que congela; de longe um tiro preditivo que retarda.',
    codigo: `feitico.definir({
  nome: "Duelista",
  elemento: "agua",
  custoMana: 26,
  recarga: 2.2,
  aoLancar(ctx) {
    const ini = ctx.inimigo();
    if (!ini) return;
    const eu = ctx.pos();
    const dist = Math.hypot(ini.x - eu.x, ini.y - eu.y);
    if (dist < 180) {
      ctx.invocar({ tipo: "feixe", direcao: ctx.anguloMira(), dano: 14, efeitos: [{ estado: "lento", duracao: 2 }] });
    } else {
      const t = dist / 480;
      ctx.invocar({
        tipo: "projetil",
        direcao: Math.atan2(ini.y + ini.vy * t - eu.y, ini.x + ini.vx * t - eu.x),
        velocidade: 480, dano: 9,
        efeitos: [{ estado: "lento", duracao: 1.5 }],
      });
    }
  },
});`,
  },
  {
    id: 'coroa', nome: 'Coroa de Guarda', tier: 'arcano',
    conceito: 'quandoInimigoPerto: defesa automática',
    descricao: 'Quando o inimigo se aproxima, levanta escudo e rebate uma onda — sem tu tocares em nada.',
    codigo: `feitico.definir({
  nome: "Coroa de Guarda",
  elemento: "arcano",
  custoMana: 20,
  recarga: 6,
  duracaoAtiva: 6,
  aoLancar(ctx) { /* a coroa vigia */ },
  quandoInimigoPerto(ctx) {
    ctx.escudo({ vida: 25 });
    ctx.invocar({ tipo: "area", centro: "eu", raio: 120, dano: 9, efeitos: [{ estado: "vento", forca: 160, duracao: 2 }] });
  },
});`,
  },
  {
    id: 'singularidade', nome: 'Singularidade', tier: 'arcano',
    conceito: 'O feitiço-assinatura: tudo o que aprendeste',
    descricao: 'Colapso devastador na mira, tinta de fuga e castigo para quem perseguir. Caro e lento — mas final.',
    codigo: `feitico.definir({
  nome: "Singularidade",
  elemento: "arcano",
  custoMana: 46,
  recarga: 7,
  aoLancar(ctx) {
    // 1. colapso na mira
    ctx.invocar({
      tipo: "area", centro: "mira", raio: 110, dano: 18,
      efeitos: [{ estado: "queimadura", dps: 2, duracao: 3 }],
    });
    // 2. anel de fuga
    for (let i = 0; i < 6; i++) {
      ctx.invocar({ tipo: "projetil", direcao: (i / 6) * Math.PI * 2, velocidade: 340, dano: 5 });
    }
    // 3. mina de castigo para quem vier atrás
    ctx.invocar({ tipo: "armadilha", direcao: ctx.anguloMira() + Math.PI, distancia: 60, raio: 44, dano: 14 });
  },
});`,
  },
];
