// Execução de hooks de feitiços com orçamento de passos.
// Cada invocação de um hook recebe um contador próprio — se o código do jogador
// exceder o limite, lançamos ErroPassos e a simulação transforma-o em mensagem mágica.
import { PASSOS } from '../constantes.js';

export class ErroPassos extends Error {
  constructor(linha) {
    super(`O feitiço consumiu energia demais (limite de passos de execução)${linha ? ` perto da linha ${linha}` : ''}. Verifica se há ciclos que correm demasiado.`);
    this.linha = linha;
  }
}

// Chama um hook de um feitiço dentro do orçamento de passos.
// rng é a função aleatória determinística da partida atual.
export function chamarHook(feitico, nome, ctx, limite, rng) {
  const h = feitico.hooks[nome];
  if (!h) return undefined;
  let n = 0;
  feitico.__despPasso.definirAlvo((linha) => {
    if (++n > limite) throw new ErroPassos(linha);
  });
  feitico.__despRng.definirAlvo(() => rng());
  try {
    return h(ctx);
  } finally {
    feitico.__despPasso.definirAlvo(null);
    feitico.__despRng.definirAlvo(null);
  }
}

export const LIMITES_HOOK = { aoLancar: PASSOS.aoLancar, aCadaTick: PASSOS.aCadaTick, evento: PASSOS.evento };
