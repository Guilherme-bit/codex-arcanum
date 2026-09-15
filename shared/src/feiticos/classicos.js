// Os 6 feitiços clássicos — são código real da API (servem de documentação viva).
import { compilarFeitico } from '../sandbox/compilador.js';

export const CODIGO_CLASSICOS = [
`// O feitiço básico: um projétil de fogo em direção à mira.
feitico.definir({
  nome: "Lança de Fogo",
  elemento: "fogo",
  custoMana: 12,
  recarga: 0.6,
  aoLancar(ctx) {
    ctx.invocar({
      tipo: "projetil",
      direcao: ctx.anguloMira(),
      velocidade: 430,
      dano: 9,
      raio: 7,
      efeitos: [{ estado: "queimadura", dps: 2, duracao: 2 }],
    });
  },
});`,

`// Um padrão com ciclo: três mísseis em leque.
feitico.definir({
  nome: "Mísseis Arcanos",
  elemento: "arcano",
  custoMana: 24,
  recarga: 2.4,
  aoLancar(ctx) {
    for (let i = -1; i <= 1; i++) {
      ctx.invocar({
        tipo: "projetil",
        direcao: ctx.anguloMira() + i * 0.22,
        velocidade: 380,
        dano: 6,
      });
    }
  },
});`,

`// O feixe acerta instantaneamente numa linha — e molha o alvo.
feitico.definir({
  nome: "Feixe de Água",
  elemento: "agua",
  custoMana: 18,
  recarga: 2.0,
  aoLancar(ctx) {
    ctx.invocar({
      tipo: "feixe",
      direcao: ctx.anguloMira(),
      alcance: 380,
      dano: 13,
      largura: 9,
      efeitos: [{ estado: "molhado", duracao: 3 }],
    });
  },
});`,

`// Área à tua volta: castigo para quem se aproxima demais.
feitico.definir({
  nome: "Onda de Terra",
  elemento: "terra",
  custoMana: 20,
  recarga: 3.5,
  aoLancar(ctx) {
    ctx.invocar({
      tipo: "area",
      centro: "eu",
      raio: 115,
      dano: 12,
      efeitos: [{ estado: "lento", duracao: 2 }],
    });
  },
});`,

`// O escudo absorve dano antes da vida — mas quebra.
feitico.definir({
  nome: "Barreira Arcana",
  elemento: "arcano",
  custoMana: 25,
  recarga: 6,
  aoLancar(ctx) {
    ctx.escudo({ vida: 45 });
  },
});`,

`// Empurrar o inimigo com vento: controlo de posição.
feitico.definir({
  nome: "Rajada de Ar",
  elemento: "ar",
  custoMana: 14,
  recarga: 2.2,
  aoLancar(ctx) {
    ctx.invocar({
      tipo: "projetil",
      direcao: ctx.anguloMira(),
      velocidade: 520,
      dano: 5,
      raio: 9,
      efeitos: [{ estado: "vento", forca: 180, duracao: 2 }],
    });
  },
});`,
];

let _classicos = null;

export function obterClassicos() {
  if (!_classicos) {
    _classicos = CODIGO_CLASSICOS.map((codigo, i) => {
      const r = compilarFeitico(codigo);
      if (!r.ok) throw new Error('Feitiço clássico inválido: ' + r.erros.join(' | '));
      return { id: 'classico-' + (i + 1), classico: true, ...r.feitico };
    });
  }
  return _classicos;
}
