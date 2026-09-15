// IA do bot de treino do Polígono: aproxima-se, dispara, esquiva, desvia de
// obstáculos e faz dash quando fica preso. Corre localmente no cliente.
import { inputVazio } from './simulacao.js';
import { colideObstaculo } from './simulacao.js';
import { JOGADOR } from '../constantes.js';

export function inputDoBot(partida, idBot, memoria = {}) {
  const c = partida.consultar(idBot);
  const input = inputVazio();
  if (!c || !c.inimigo || c.fase !== 'luta') return input;
  memoria.rng ??= partida.rng;
  const rng = memoria.rng;

  const e = c.inimigo;
  const dx = e.x - c.x, dy = e.y - c.y;
  const dist = Math.hypot(dx, dy) || 1;
  input.miraX = e.x; input.miraY = e.y;

  // Linha de visão livre? (evita gastar feitiços contra pilares)
  const ux0 = dx / dist, uy0 = dy / dist;
  let visivel = true;
  for (let i = 1; i <= 6; i++) {
    if (colideObstaculo(c.x + (ux0 * dist * i) / 6, c.y + (uy0 * dist * i) / 6, 3)) { visivel = false; break; }
  }

  // Esquiva: projétil inimigo a caminho → fugir perpendicular
  let ex = 0, ey = 0;
  for (const p of c.projeteis) {
    const pdx = c.x - p.x, pdy = c.y - p.y;
    if (Math.hypot(pdx, pdy) < 190 && (p.vx * pdx + p.vy * pdy) > 0) {
      const pl = Math.hypot(-p.vy, p.vx) || 1;
      ex += -p.vy / pl; ey += p.vx / pl;
    }
  }

  // Direção desejada: aproximar/afastar da distância ideal + strafe
  if (memoria.strafeT === undefined || memoria.strafeT <= 0) {
    memoria.strafeT = 0.7 + rng() * 1.2;
    memoria.strafeDir = rng() < 0.5 ? -1 : 1;
  }
  memoria.strafeT -= 1 / 60;
  const ux = dx / dist, uy = dy / dist;
  const fator = Math.max(-1, Math.min(1, (dist - 230) / 120));
  const pesoStrafe = !visivel ? 1.0 : (dist > 420 ? 0.15 : 0.7); // sem visão: reposiciona
  let mx = ux * fator + -uy * memoria.strafeDir * pesoStrafe;
  let my = uy * fator + ux * memoria.strafeDir * pesoStrafe;

  if (ex || ey) { mx = ex; my = ey; }

  // Desvio de obstáculos: se a frente estiver bloqueada, roda até encontrar espaço
  let ang = Math.atan2(my, mx);
  if (colideObstaculo(c.x + Math.cos(ang) * 38, c.y + Math.sin(ang) * 38, JOGADOR.raio)) {
    let escapou = false;
    for (const desvio of [0.65, -0.65, 1.3, -1.3, 2.1, -2.1, Math.PI]) {
      const a2 = ang + desvio;
      if (!colideObstaculo(c.x + Math.cos(a2) * 38, c.y + Math.sin(a2) * 38, JOGADOR.raio)) { ang = a2; escapou = true; break; }
    }
    if (!escapou) ang = Math.atan2(300 - c.y, 480 - c.x); // canto: foge para o centro da arena
    mx = Math.cos(ang); my = Math.sin(ang);
  }

  // Anti-bloqueio: se mal se mexeu durante 0.5s, faz dash e inverte o strafe
  const mexeu = Math.hypot(c.x - (memoria.ultX ?? -999), c.y - (memoria.ultY ?? -999));
  memoria.ultX = c.x; memoria.ultY = c.y;
  if (mexeu < 2) { memoria.presoT = (memoria.presoT ?? 0) + 1 / 60; } else { memoria.presoT = 0; }
  if (memoria.presoT > 0.5) {
    memoria.presoT = 0;
    memoria.strafeDir *= -1;
    if (c.dashPronto) input.dash = true;
  }

  if (mx > 0.3) input.dir = true; else if (mx < -0.3) input.esq = true;
  if (my > 0.3) input.baixo = true; else if (my < -0.3) input.cima = true;

  // Ataques (usa o loadout clássico nas 6 slots) — só com linha de visão
  if (visivel) {
    if (dist < 600 && c.recargas[0] <= 0 && c.mana >= 12) input.lancar |= 1;
    if (dist < 430 && c.recargas[1] <= 0 && c.mana >= 24 && rng() < 0.03) input.lancar |= 2;
    if (dist < 330 && c.recargas[2] <= 0 && c.mana >= 18 && rng() < 0.04) input.lancar |= 4;
    if (dist < 430 && c.recargas[5] <= 0 && c.mana >= 14 && rng() < 0.02) input.lancar |= 32;
  }
  if (dist < 100 && c.recargas[3] <= 0 && c.mana >= 20) input.lancar |= 8;
  if (c.vida < 45 && c.recargas[4] <= 0 && c.mana >= 25) input.lancar |= 16;
  if ((dist < 85 || c.projeteis.length > 2) && c.dashPronto && rng() < 0.06) input.dash = true;
  return input;
}
