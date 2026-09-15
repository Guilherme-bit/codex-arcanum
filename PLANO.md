# PLANO — Estado de desenvolvimento

Atualizado: 2026-09-15

| Fase | Âmbito | Estado |
|---|---|---|
| **0 — Fundações** | monorepo (`client`/`server`/`shared`/`docs`), README, PLANO, arena a renderizar | ✅ Feito |
| **1 — Núcleo local** | movimento WASD, mira com rato, feitiços, HP/dano, melhor de 3, 90s + morte súbita | ✅ Feito |
| **2 — Motor de feitiços** | API completa (secção 3 do conceito), sandbox com limite de passos + timeout, validador com erros temáticos, determinismo por semente | ✅ Feito |
| **3 — Editor e treino** | Monaco integrado com autocomplete da API, "Testar no Polígono", bot com IA (perseguição, disparo, esquiva, desvio de obstáculos, anti-bloqueio) | ✅ Feito |
| **4 — Multiplayer** | servidor autoritativo Socket.IO, salas, matchmaking casual/ranqueado, validação server-side do código, snapshots 20 Hz + interpolação, walkover por desistência | ✅ Feito |
| **5 — Academia e progressão** | 8 capítulos com verificação automática (AST + simulação), XP/níveis, desbloqueio de componentes, export/import de feitiços | ✅ Feito |
| **6 — Competitivo e polimento** | Elo + ligas, partículas, screen shake, áudio WebAudio, menus/lobby, ícone próprio (SVG + PNG + favicon.ico) | ✅ Feito (grimório público com avaliações → fase 7+) |
| **7 — Desktop (opcional)** | Tauri | ⬜ Por fazer (ícone e PWA já prontos) |

## Desvios justificados ao plano original

1. **Canvas 2D puro em vez de PixiJS** no MVP — menos dependências, bundle leve e 60 fps fácil com este nº de entidades. Migração para PixiJS é isolada ao `client/src/render/`.
2. **Snapshots a 20 Hz com simulação a 60 Hz** — conforme especificado; inputs chegam a 30 Hz.
3. **Comentários de depuração removidos**; o servidor mantém registos mínimos de ciclo de vida (`[partida]`, `[fim]`, `[desligou]`) úteis em produção.

## Critérios de aceitação verificados

- ✅ `npm test` verde: determinismo, sandbox, academia (8/8 exemplos passam; 8/8 esqueletos falham como esperado).
- ✅ Ciclo escrever → testar → ajustar sem sair do jogo (editor → "Testar no Polígono").
- ✅ Duelo 1v1 online com estado sincronizado (testado no browser com 2 clientes: matchmaking, input, snapshots, desistência → vitória).
- ✅ Ícone próprio gerado por script (`npm run icones`).

## Fica para depois

- Grimório público com comentários/avaliações (precisa de BD).
- Replays (seed + inputs — a simulação já é determinística).
- Reconexão a meio do duelo; persistência de Elo em BD.
- Tauri desktop; 2v2; mais mapas.
