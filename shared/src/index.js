// Ponto de entrada do pacote partilhado (@codex/shared).
export * from './constantes.js';
export { criarRng } from './rng.js';
export {
  compilarFeitico, errosDeCodigo, analisarCodigo, traduzirSintaxe, traduzirRuntime, ErroFeitico,
} from './sandbox/compilador.js';
export { chamarHook, ErroPassos } from './sandbox/maquina.js';
export { construirCtx, alvoAplicavel } from './spells/api.js';
export { Partida, inputVazio } from './sim/simulacao.js';
export { inputDoBot } from './sim/bot.js';
export { CODIGO_CLASSICOS, obterClassicos } from './feiticos/classicos.js';
export { LICOES } from './academia/licoes.js';
export { verificarLicao } from './academia/verificar.js';
export * from './progresso.js';
