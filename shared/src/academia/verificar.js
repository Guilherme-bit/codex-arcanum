// Verificação automática dos desafios da Academia.
// Cada lição tem um verificador que combina análise estática (AST) com uma
// simulação real da partida — o feitiço tem de FUNCIONAR, não apenas existir.
import { Partida } from '../sim/simulacao.js';
import { compilarFeitico } from '../sandbox/compilador.js';

// Constrói uma partida de teste: o jogador 'eu' tem só o feitiço em teste;
// o 'alvo' é um boneco de treino sem loadout.
function cenario(feitico) {
  const partida = new Partida({
    semente: 42,
    jogadores: [
      { id: 'eu', nome: 'Eu', loadout: [feitico, null, null, null, null, null] },
      { id: 'alvo', nome: 'Alvo', loadout: [] },
    ],
  });
  partida.fimRound = () => {}; // nos testes ninguém "morre" a sério
  let invocacoes = 0;
  let ultimoTiro = null;
  const original = partida.invocar.bind(partida);
  partida.invocar = (...a) => {
    invocacoes++;
    const op = a[3];
    if (op && op.tipo === 'projetil') ultimoTiro = op;
    return original(...a);
  };
  return {
    partida,
    contar: () => invocacoes,
    zerar: () => { invocacoes = 0; },
    tiroDisparado: () => ultimoTiro,
  };
}

// Corre nCasts lançamentos contra o alvo; devolve dano acumulado e nº de invocações.
function correr(feitico, opts = {}) {
  const { posAlvo = { x: 620, y: 140 }, movimento = null, nCasts = 1, ticks = 420 } = opts;
  const { partida, contar, zerar } = cenario(feitico);
  const alvo = partida.jogadorPorId('alvo');
  alvo.x = posAlvo.x; alvo.y = posAlvo.y;
  let danoTotal = 0, vidaAntes = 100, teveEstado = false;
  partida.definirInput('eu', { miraX: posAlvo.x, miraY: posAlvo.y, lancar: 1 });
  let esperaCast = nCasts > 1 ? Math.ceil(feitico.recarga * 60) + 20 : 1e9;
  for (let t = 0; t < ticks; t++) {
    if (movimento) movimento(alvo, t);
    partida.definirInput('eu', { miraX: alvo.x, miraY: alvo.y });
    if (esperaCast > 0) esperaCast--;
    if (esperaCast === 0) { partida.definirInput('eu', { lancar: 1 }); esperaCast = Math.ceil(feitico.recarga * 60) + 20; }
    partida.passo();
    if (alvo.vida < vidaAntes) { danoTotal += vidaAntes - alvo.vida; vidaAntes = alvo.vida; }
    if (alvo.estados.length > 0 || partida.jogadorPorId('eu').estados.length > 0) teveEstado = true;
  }
  return { danoTotal, invocacoes: contar(), estadosAlvo: alvo.estados.map((e) => e.estado), teveEstado, zerar, partida };
}

const ok = (texto) => ({ ok: true, texto });
const falha = (texto) => ({ ok: false, texto });

const VERIFICADORES = {
  1: (f) => {
    const rel = [];
    const r = correr(f);
    rel.push(r.invocacoes >= 1 ? ok(`Feitiço invocado ${r.invocacoes}×(1).`) : falha('Nenhuma invocação detetada — chama ctx.invocar(...) dentro do aoLancar.'));
    rel.push(r.danoTotal > 0 ? ok(`O alvo sofreu ${Math.round(r.danoTotal)} de dano.`) : falha('O alvo não sofreu dano — verifica a direção e o dano do projétil.'));
    return { ok: rel.every((x) => x.ok), relatorio: rel };
  },

  2: (f, _codigo, flags) => {
    const rel = [];
    rel.push(flags.usaVariavel ? ok('Encontrei uma variável (const/let).') : falha('Declara uma variável com const ou let.'));
    const r = correr(f);
    rel.push(r.danoTotal > 0 ? ok('O projétil guardado na variável acertou no alvo.') : falha('O projétil não acertou — a direção deve vir da variável.'));
    return { ok: rel.every((x) => x.ok), relatorio: rel };
  },

  3: (f, _codigo, flags) => {
    const rel = [];
    rel.push(flags.ifs >= 1 ? ok('Encontrei uma decisão (if).') : falha('Falta o if — o feitiço tem de decidir pelo caminho perto/longe.'));
    const longe = correr(f, { posAlvo: { x: 620, y: 140 } });
    const perto = correr(f, { posAlvo: { x: 165, y: 300 } });
    rel.push(longe.danoTotal > 0 ? ok('Caminho LONGE acerta.') : falha('A longa distância o feitiço não acerta (usa um projétil no else).'));
    rel.push(perto.danoTotal > 0 ? ok('Caminho PERTO acerta.') : falha('De perto o feitiço não acerta (usa um feixe no if).'));
    return { ok: rel.every((x) => x.ok), relatorio: rel };
  },

  4: (f, _codigo, flags) => {
    const rel = [];
    rel.push(flags.ciclos >= 1 ? ok('Encontrei um ciclo (for/while).') : falha('Usa um ciclo for para repetir as invocações.'));
    const r = correr(f);
    rel.push(r.invocacoes === 8 ? ok('Exatamente 8 projéteis invocados.') : falha(`Foram invocados ${r.invocacoes} — o desafio pede exatamente 8.`));
    return { ok: rel.every((x) => x.ok), relatorio: rel };
  },

  5: (f, _codigo, flags) => {
    const rel = [];
    rel.push(flags.declaraFuncao ? ok('Encontrei uma função declarada.') : falha('Declara uma função própria (function nome(...) { ... }) dentro do aoLancar.'));
    const r = correr(f);
    rel.push(r.invocacoes >= 4 ? ok(`A função foi usada o suficiente (${r.invocacoes} invocações).`) : falha(`Apenas ${r.invocacoes} invocações — chama a tua função pelo menos 2× (≥4 projéteis).`));
    return { ok: rel.every((x) => x.ok), relatorio: rel };
  },

  6: (f, _codigo, flags) => {
    const rel = [];
    rel.push(flags.usaTrig ? ok('Encontrei trigonometria (Math.atan2/hypot/sin/cos).') : falha('Usa Math.atan2 (e Math.hypot) para calcular o ângulo previsto.'));
    // Alvo em movimento vertical: o ângulo do projétil tem de apontar ao ponto de interceção.
    const { partida, tiroDisparado } = cenario(f);
    const alvo = partida.jogadorPorId('alvo');
    alvo.x = 640; alvo.y = 60;
    partida.definirInput('alvo', { baixo: true }); // desce a 185 u/s (velocidade real da simulação)
    const vel = 400, s = 185;
    let posNoCast = null;
    for (let t = 0; t < 240; t++) {
      partida.definirInput('eu', { miraX: alvo.x, miraY: alvo.y });
      if (t === 3) { posNoCast = { x: alvo.x, y: alvo.y }; partida.definirInput('eu', { lancar: 1 }); }
      partida.passo();
    }
    const tiro = tiroDisparado();
    if (!tiro) { rel.push(falha('Nenhum projétil foi disparado.')); return { ok: false, relatorio: rel }; }
    // Ângulo ideal de interceção: resolve |alvo + s·t| = v·t
    const dx0 = posNoCast.x - 110, dy0 = posNoCast.y - 300;
    const A = vel * vel - s * s, B = -2 * s * dy0, C = -(dx0 * dx0 + dy0 * dy0);
    const tInt = (-B + Math.sqrt(B * B - 4 * A * C)) / (2 * A);
    const ideal = Math.atan2(dy0 + s * tInt, dx0);
    const dif = Math.abs(Math.atan2(Math.sin(tiro.direcao - ideal), Math.cos(tiro.direcao - ideal)));
    rel.push(dif < 0.3
      ? ok(`Mira preditiva correta (desvio de ${dif.toFixed(2)} rad do ângulo ideal).`)
      : falha(`O projétil apontou ${tiro.direcao.toFixed(2)} rad mas o ponto de interceção exige ${ideal.toFixed(2)} rad. Prevê a posição futura: t = distância ÷ velocidade.`));
    return { ok: rel.every((x) => x.ok), relatorio: rel };
  },

  7: (f, _codigo, flags) => {
    const rel = [];
    const temEvento = !!(f.hooks.aoSerAcertado || f.hooks.aCadaTick || f.hooks.quandoVidaBaixa) || flags.usaHookEventos;
    rel.push(temEvento ? ok('Encontrei um hook de evento.') : falha('Define aoAcertar(alvo) no projétil (ou aoSerAcertado no feitiço).'));
    const r = correr(f);
    const temEstado = r.teveEstado;
    rel.push(temEstado ? ok('Um estado ficou ativo por causa do evento.') : falha('Nenhum estado foi aplicado — usa alvo.aplicar("queimadura", { dps: 2, duracao: 3 }) no aoAcertar.'));
    return { ok: rel.every((x) => x.ok), relatorio: rel };
  },

  8: (f) => {
    const rel = [];
    const custo = f.custoMana;
    rel.push(custo >= 8 && custo <= 25 ? ok(`custoMana = ${custo} (dentro dos limites).`) : falha(`custoMana = ${custo} — tem de ficar entre 8 e 25.`));
    const r = correr(f, { nCasts: 3, ticks: 700 });
    const eficiencia = r.danoTotal / (custo * 3);
    rel.push(eficiencia >= 1.2
      ? ok(`Eficiência ${eficiencia.toFixed(2)} (${Math.round(r.danoTotal)} de dano ÷ ${custo * 3} mana).`)
      : falha(`Eficiência ${eficiencia.toFixed(2)} — abaixo de 1.2. Usa estados (queimadura) e múltiplos projéteis.`));
    return { ok: rel.every((x) => x.ok), relatorio: rel };
  },
};

export function verificarLicao(idLicao, codigo) {
  const comp = compilarFeitico(codigo);
  if (!comp.ok) {
    return { ok: false, relatorio: comp.erros.map((t) => ({ ok: false, texto: t })) };
  }
  const verificador = VERIFICADORES[idLicao];
  if (!verificador) return { ok: false, relatorio: [falha('Lição sem verificador.')] };
  try {
    return verificador(comp.feitico, codigo, comp.feitico.flags);
  } catch (e) {
    return { ok: false, relatorio: [{ ok: false, texto: 'Erro durante o teste: ' + (e?.message ?? String(e)) }] };
  }
}
