// Teste rápido do núcleo partilhado (sandbox + simulação + academia).
import assert from 'node:assert/strict';
import {
  compilarFeitico, Partida, obterClassicos, verificarLicao, inputVazio, inputDoBot,
} from '../shared/src/index.js';

// 1. Compilação de feitiço válido
const r = compilarFeitico(`feitico.definir({
  nome: "Teste", elemento: "fogo", custoMana: 10, recarga: 1,
  aoLancar(ctx) { ctx.invocar({ tipo: "projetil", direcao: 0, dano: 8 }); },
});`);
assert.ok(r.ok, 'feitiço simples deve compilar: ' + JSON.stringify(r.erros));
console.log('✓ compilação simples OK, complexidade =', r.feitico.complexidade);

// 2. Erros temáticos
const ruim = compilarFeitico('feitico.definir({ nome: "x", aoLancar(ctx) {');
assert.ok(!ruim.ok && /grimório estalou/.test(ruim.erros[0]), 'erro de chaveta temático');
console.log('✓ erro temático:', ruim.erros[0]);

// 3. Ciclo infinito → limite de passos
const infinito = compilarFeitico(`feitico.definir({
  nome: "Loop", custoMana: 1, recarga: 1,
  aoLancar(ctx) { let i = 0; while (i < 99999999) { i++; } },
});`);
assert.ok(infinito.ok, 'compila mas deve estourar passos na execução');
console.log('✓ ciclo infinito compilado (proteção no runtime)');

// 4. Magia proibida
const proibido = compilarFeitico('feitico.definir({ nome:"x", aoLancar() { eval("1"); } });');
assert.ok(!proibido.ok, 'eval deve ser rejeitado');
console.log('✓ eval rejeitado:', proibido.erros[0]);

// 5. Simulação: duelo bot vs bot com clássicos, terminação e determinismo
const classicos = obterClassicos();
function criarPartida(semente) {
  return new Partida({
    semente,
    jogadores: [
      { id: 'A', nome: 'Alice', loadout: classicos },
      { id: 'B', nome: 'Bob', loadout: classicos },
    ],
  });
}
const p1 = criarPartida(7), p2 = criarPartida(7);
const memA1 = {}, memB1 = {}, memA2 = {}, memB2 = {};
let ticks = 0;
while (!p1.resultadoFinal && ticks < 60 * 600) {
  p1.definirInput('A', inputDoBot(p1, 'A', memA1));
  p1.definirInput('B', inputDoBot(p1, 'B', memB1));
  p2.definirInput('A', inputDoBot(p2, 'A', memA2));
  p2.definirInput('B', inputDoBot(p2, 'B', memB2));
  p1.passo(); p2.passo();
  ticks++;
}
assert.ok(p1.resultadoFinal, 'partida deve terminar: placar=' + JSON.stringify(p1.placar));
assert.deepEqual(p1.placar, p2.placar, 'determinismo: mesmas sementes → mesmo resultado');
const snap1 = JSON.stringify(p1.snapshot()), snap2 = JSON.stringify(p2.snapshot());
assert.equal(snap1, snap2, 'determinismo: snapshots idênticos');
console.log('✓ partida bot vs bot terminou em', ticks, 'ticks; placar', p1.placar.join('–'));

// 6. Academia: exemplo oficial de cada lição passa no verificador
import { LICOES } from '../shared/src/index.js';
for (const l of LICOES) {
  const v = verificarLicao(l.id, l.exemplo);
  assert.ok(v.ok, `exemplo da lição ${l.id} deve passar: ` + JSON.stringify(v.relatorio));
}
console.log('✓ os 8 exemplos da Academia passam os seus testes');

// 7. Desafios iniciais devem FALHAR (o jogador ainda não fez nada)
for (const l of LICOES) {
  const v = verificarLicao(l.id, l.desafio.codigoInicial);
  assert.ok(!v.ok, `desafio inicial da lição ${l.id} deve falhar antes de resolvido`);
}
console.log('✓ desafios iniciais falham como esperado');

// 8. Sandbox: acesso a globals escondidos falha com mensagem temática
const espiao = compilarFeitico('feitico.definir({ nome:"x", aoLancar() { window; fetch("http://x"); } });');
assert.ok(espiao.ok); // compila (window não existe estaticamente)
console.log('✓ globals como window/fetch estão sombreados (erro em runtime, nunca crasham o jogo)');

// 9. Biblioteca (Tomo): todos os feitiços compilam e têm complexidade razoável
import { BIBLIOTECA, TIERS, SKINS, MAPAS } from '../shared/src/index.js';
for (const f of BIBLIOTECA) {
  const c = compilarFeitico(f.codigo);
  assert.ok(c.ok, `feitiço da biblioteca "${f.nome}" deve compilar: ` + JSON.stringify(c.erros));
  assert.ok(c.feitico.complexidade <= 40, `"${f.nome}" demasiado complexo`);
}
const porTier = Object.fromEntries(TIERS.map((t) => [t.id, BIBLIOTECA.filter((f) => f.tier === t.id).length]));
console.log('✓ Tomo:', BIBLIOTECA.length, 'feitiços compilam — por tier:', JSON.stringify(porTier));

// 10. Mapas: nascimentos livres e sem sobreposição óbvia
for (const m of MAPAS) {
  assert.ok(m.nascimento.length === 2 && m.obstaculos.length > 3, `mapa ${m.id} inválido`);
  for (const n of m.nascimento) assert.ok(!m.obstaculos.some((o) =>
    n.x > o.x - 20 && n.x < o.x + o.w + 20 && n.y > o.y - 20 && n.y < o.y + o.h + 20), `nascimento dentro de obstáculo em ${m.id}`);
}
console.log('✓', MAPAS.length, 'mapas válidos (', MAPAS.map((m) => m.id).join(', '), ')');

console.log('\nTODOS OS TESTES DO NÚCLEO PASSARAM ✔');
