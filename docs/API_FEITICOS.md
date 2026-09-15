# 📖 API de Magia — Referência

Cada feitiço é uma função JavaScript. O jogo executa-o dentro de uma sandbox
com orçamento de passos de execução — erros nunca crasham o jogo; transformam-se
em mensagens mágicas.

```js
feitico.definir({
  nome: "Lança Tripla",          // string (máx. 24 car.)
  elemento: "fogo",              // fogo | agua | terra | ar | arcano
  custoMana: 30,                 // 0–80
  recarga: 2.5,                  // 0.15–30 s
  duracaoAtiva: 3,               // s durante os quais aCadaTick corre (0.5–10)
  aoLancar(ctx) { },             // quando lanças o feitiço
  aCadaTick(ctx) { },            // todos os ticks enquanto ativo
  aoSerAcertado(ctx) { },        // quando o PORTADOR do feitiço é atingido
  quandoVidaBaixa(ctx) { },      // vida < 30% (recarga interna 8 s)
  quandoInimigoPerto(ctx) { },   // inimigo entra no perímetro (< 220 unid.)
  quandoInimigoLonge(ctx) { },   // inimigo afasta-se
});
```

## `ctx` — o teu link ao mundo

| Método | Devolve | Descrição |
|---|---|---|
| `ctx.pos()` | `{x, y}` | a tua posição |
| `ctx.mira()` | `{x, y}` | ponto do mundo para onde o rato aponta |
| `ctx.anguloMira()` | rad | ângulo da mira |
| `ctx.vida()` / `ctx.mana()` | nº | recursos atuais |
| `ctx.tempo()` | s | segundos restantes da ronda |
| `ctx.inimigo()` | `{x, y, vx, vy, vida, escudo}` ou `null` | dados do inimigo — `vx/vy` permitem **mira preditiva** |
| `ctx.distanciaInimigo()` | nº | `Infinity` se não houver |
| `ctx.anguloParaInimigo()` | rad | mira direta ao inimigo |
| `ctx.invocar(op)` | — | o componente principal (abaixo) |
| `ctx.dash({distancia, direcao})` | — | deslocamento rápido |
| `ctx.teleporte({distancia, direcao})` | — | salto instantâneo |
| `ctx.escudo({vida})` | — | absorve dano antes da vida (máx. 80) |
| `ctx.aura({raio, dps, duracao, elemento})` | — | fere inimigos dentro do raio |
| `ctx.aleatorio()` | 0..1 | determinístico (a mesma partida → mesmos valores) |
| `ctx.escrever(...)` | — | consola do jogo (depuração) |

> `Math` está disponível (sem `Math.random`); existem os aliases `aleatorio()` e `escrever()`.

## `ctx.invocar(op)` — componentes

### `projetil`
```js
ctx.invocar({
  tipo: "projetil",
  direcao: 0,            // radianos (por omissão: mira)
  velocidade: 400,       // 60–900 unid./s
  dano: 8,               // 0–40
  raio: 6,               // 3–18
  vida: 2.5,             // segundos de voo (0.2–6)
  efeitos: [...],        // ver "Estados"
  aoAcertar(alvo) { },   // hook próprio do projétil
});
```
Projéteis de jogadores diferentes **colidem entre si** (parry mágico).

### `feixe`
```js
ctx.invocar({ tipo: "feixe", direcao, alcance: 380, dano: 14, largura: 8, efeitos });
```
Instantâneo numa linha; parado no primeiro obstáculo.

### `area`
```js
ctx.invocar({ tipo: "area", centro: "eu", raio: 80, dano: 14, efeitos });
```
`centro: "eu"` (à tua volta) ou `"mira"` (a 220 unid. na direção da mira).

### `armadilha`
```js
ctx.invocar({ tipo: "armadilha", direcao, distancia: 100, raio: 34, dano: 15, duracao: 8, efeitos });
```
Arma-se em 0.6 s; explode quando o inimigo entra.

### `escudo`, `aura`, `dash`, `teleporte`
Também podem ser invocados por `invocar({ tipo: ... })` — equivalentes aos métodos diretos do `ctx`.

## `alvo` — no hook `aoAcertar(alvo)`

| Método | Descrição |
|---|---|
| `alvo.x`, `alvo.y`, `alvo.vida()` | dados do alvo |
| `alvo.aplicar(estado, { dps, duracao, forca })` | aplica um estado |
| `alvo.empurrar(angulo, forca)` | desloca o alvo |

## Estados e sinergias

| Estado | Efeito |
|---|---|
| `queimadura` | dano contínuo (`dps`) durante `duracao` |
| `molhado` | marca — desencadeia sinergias |
| `cego` | os tiros do alvo dispersam |
| `lento` | velocidade −45% |
| `vento` | empurrão instantâneo (`forca`) + marca 2 s |

**Sinergias** (aplicar um estado sobre quem já tem outro):
- `queimadura` + `molhado` → **vapor**: cega 2 s + 4 de dano extra
- `queimadura` + `vento` → **explosão**: +6 de dano extra
- `molhado` + `queimadura` → **extingue** a queimadura e cura 3

## Regras da sandbox

- **Passos de execução**: 5000 por `aoLancar`, 900 por `aCadaTick`/evento. Ciclos infinitos são cortados com mensagem temática.
- **Magia proibida**: `eval`, `Function`, `.constructor`, `__proto__`, `import`, `debugger`, nomes `__*`, acesso a `window/document/fetch/...` (sombreados) — tudo rejeitado ou transformado em erro mágico.
- **Determinismo**: nenhuma fonte de aleatoriedade fora de `ctx.aleatorio()`; a simulação corre a ticks fixos de 60 Hz → mesma seed + mesmos inputs = mesma partida (base para replays).
- **Energia arcana**: a complexidade de cada feitiço (medida da AST) soma no loadout — máximo 100 entre os 6 slots.
