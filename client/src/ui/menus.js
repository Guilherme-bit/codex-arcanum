// Ecrãs de menu: Início, Polígono, Duelo online e Perfil.
import { LICOES, componentesDesbloqueados, proximosDesbloqueios, RECOMPENSAS_XP, ligaDe } from '@codex/shared';
import { perfil } from '../perfil.js';
import { criarBarraTopo, navegar } from './comum.js';
import { criarSeletorLoadout } from './loadout.js';
import { iniciarJogoLocal, iniciarJogoOnline } from '../jogo/execucao.js';
import { obterSocket, procurarDuelo, cancelarProcura } from '../rede.js';
import { som } from '../audio.js';

// ── Início ──────────────────────────────────────────────────────────────────
export function ecraInicio(raiz) {
  const ecra = document.createElement('div');
  ecra.className = 'ecra ecra-centro';
  const nome = perfil.dados.nome || '';
  ecra.innerHTML = `
    <img class="logotipo" src="/icon.svg" alt="Codex Arcanum"/>
    <div class="titulo-jogo">CODEX ARCANUM</div>
    <div class="subtitulo">Onde a academia ensina e o duelo examina — os teus feitiços são programas.</div>

    <div style="margin-top:22px; display:flex; gap:10px; align-items:center; width:min(420px, 90%);">
      <input type="text" placeholder="Nome do teu mago…" value="${nome}" maxlength="18" data-nome/>
    </div>

    <div class="cartoes-menu">
      <div class="cartao-menu" data-ir="#/academia">
        <div class="emblema">📜</div><h3>Academia</h3>
        <p>Oito capítulos que te levam do primeiro projétil à mira preditiva. ${perfil.dados.licoes.length}/${LICOES.length} concluídos.</p>
      </div>
      <div class="cartao-menu" data-ir="#/grimorio">
        <div class="emblema">📖</div><h3>Grimório</h3>
        <p>Escreve, guarda e equipa os teus feitiços. Importa e exporta em JSON.</p>
      </div>
      <div class="cartao-menu" data-ir="#/poligono">
        <div class="emblema">🎯</div><h3>Polígono de Treino</h3>
        <p>Testa os teus feitiços contra um bot antes de levares a magia ao duelo.</p>
      </div>
      <div class="cartao-menu" data-ir="#/duelo">
        <div class="emblema">⚔</div><h3>Duelo Online</h3>
        <p>1v1 autoritativo com matchmaking. Casual ou ranqueado com Elo.</p>
      </div>
    </div>
    <p style="margin-top:26px; color:var(--texto-2); font-size:13px;">
      Nível ${perfil.nivel} · ★ ${perfil.dados.rating} (${ligaDe(perfil.dados.rating)}) · ${perfil.dados.stats.v}V/${perfil.dados.stats.d}D
    </p>`;
  raiz.appendChild(ecra);

  const inputNome = ecra.querySelector('[data-nome]');
  inputNome.onchange = () => { perfil.definirNome(inputNome.value.trim()); };
  ecra.querySelectorAll('[data-ir]').forEach((c) => { c.onclick = () => navegar(c.dataset.ir); });
  return { destruir() {} };
}

// ── Polígono de Treino ──────────────────────────────────────────────────────
export function ecraPoligono(raiz) {
  raiz.appendChild(criarBarraTopo('poligono'));
  const ecra = document.createElement('div');
  ecra.className = 'ecra';
  const testeCodigo = sessionStorage.getItem('codex-testar-codigo');
  ecra.innerHTML = `
    <h1>Polígono de Treino</h1>
    <p class="subtitulo">Duelo offline contra um bot: aproxima-se, dispara e esquiva. XP pelo dano causado.</p>
    ${testeCodigo ? '<div class="enunciado" style="margin-top:10px;">✦ A testar o feitiço que acabaste de editar (no slot 1).</div>' : ''}
    <div data-loadout style="margin-top:8px;"></div>
    <div style="margin-top:16px;"><button class="ouro" data-comecar style="font-size:17px; padding:12px 30px;">▶ Começar treino</button></div>
    <div data-xp-msg class="estado-validacao ok" style="margin-top:10px;"></div>`;
  raiz.appendChild(ecra);

  // feitiço vindo do editor → equipa no slot 1
  if (testeCodigo) {
    sessionStorage.removeItem('codex-testar-codigo');
    const r = perfil.guardarFeitico(testeCodigo);
    if (r.ok) perfil.equipar(0, r.id);
  }

  criarSeletorLoadout(ecra.querySelector('[data-loadout]'));

  ecra.querySelector('[data-comecar]').onclick = () => {
    const loadout = perfil.loadoutCompilado();
    if (!loadout.some(Boolean)) return;
    let sessao;
    sessao = iniciarJogoLocal({
      loadout,
      aoDano: null,
      aoSair: (dano) => {
        sessao?.destruir();
        const xp = Math.min(30, Math.round((dano ?? 0) / 15));
        if (xp > 0) {
          const novoNivel = perfil.adicionarXP(xp);
          som(novoNivel ? 'nivel' : 'ui');
          ecra.querySelector('[data-xp-msg]').textContent = `+${xp} XP de treino (${Math.round(dano)} de dano causado)${novoNivel ? ` — NÍVEL ${novoNivel}!` : ''}`;
        }
        navegar('#/poligono');
      },
    });
  };

  return { destruir() {} };
}

// ── Duelo Online ────────────────────────────────────────────────────────────
export function ecraDuelo(raiz) {
  raiz.appendChild(criarBarraTopo('duelo'));
  const ecra = document.createElement('div');
  ecra.className = 'ecra ecra-centro';
  ecra.innerHTML = `
    <h1>Duelo Online</h1>
    <p class="subtitulo">Melhor de 3 rondas · 100 PV · 90 segundos. O código dos teus feitiços é validado e executado no servidor.</p>
    <div class="estado-validacao" data-ligacao style="margin-top:8px;">A ligar ao servidor…</div>
    <div class="modo-cartoes">
      <button class="cartao-menu modo-cartao" data-modo="casual" disabled>
        <h3>⚔ Casual</h3><p>Sem rating em jogo — sítio para experimentar builds novas.</p>
      </button>
      <button class="cartao-menu modo-cartao" data-modo="ranqueado" disabled>
        <h3>🏆 Ranqueado</h3><p>Aparelha por rating. Vitória sobe o Elo, derrota desce.</p>
      </button>
    </div>
    <div class="fila-estado" data-fila style="display:none;">
      <svg class="pentagrama-giratorio" viewBox="0 0 64 64" width="66" height="66">
        <circle cx="32" cy="32" r="28" fill="none" stroke="#c77dff" stroke-width="2" stroke-dasharray="10 6"/>
        <circle cx="32" cy="32" r="18" fill="none" stroke="#ffd166" stroke-width="2" stroke-dasharray="6 4"/>
        <polygon points="32,10 51,50 13,50" fill="none" stroke="#c77dff" stroke-width="2"/>
      </svg>
      <div data-fila-texto>À procura de adversário…</div>
      <button data-cancelar>Cancelar</button>
    </div>
    <div class="erro-servidor" data-erro></div>
    <div style="width:min(900px,100%); text-align:left; margin-top:26px;" data-loadout></div>`;
  raiz.appendChild(ecra);

  const ligacaoEl = ecra.querySelector('[data-ligacao]');
  const erroEl = ecra.querySelector('[data-erro]');
  const filaEl = ecra.querySelector('[data-fila]');
  const filaTexto = ecra.querySelector('[data-fila-texto]');
  const botoes = ecra.querySelectorAll('[data-modo]');
  const seletor = criarSeletorLoadout(ecra.querySelector('[data-loadout]'));

  const socket = obterSocket();
  let emFila = false;
  let sessao = null;
  let meusDados = null;

  const aoEntrado = (dados) => {
    meusDados = dados;
    ligacaoEl.textContent = `✓ Ligado${dados.rating != null ? ` · ★ ${dados.rating} (${dados.liga})` : ''} · ${dados.online} mago(s) online`;
    ligacaoEl.className = 'estado-validacao ok';
    botoes.forEach((b) => (b.disabled = false));
  };
  const aoEmFila = ({ modo }) => {
    emFila = true;
    filaEl.style.display = 'flex';
    filaTexto.textContent = modo === 'ranqueado' ? 'À procura de adversário do teu nível…' : 'À procura de adversário…';
  };
  const aoErroLoadout = (msg) => {
    erroEl.textContent = msg;
    som('erro');
  };
  const aoEncontrado = (info) => {
    emFila = false;
    filaEl.style.display = 'none';
    ecra.style.display = 'none';
    const loadout = perfil.loadoutCompilado();
    sessao = iniciarJogoOnline({
      socket, infoDuelo: info, loadout,
      aoSair: () => { sessao?.destruir(); sessao = null; ecra.style.display = ''; },
    });
    sessoesParaLimpar.push(sessao);
  };
  const aoFimDuelo = (res) => {
    sessao?.destruir(); sessao = null;
    ecra.style.display = '';
    perfil.registarDuelo(res.venci, res.rating);
    const xp = res.venci ? RECOMPENSAS_XP.vitoria : RECOMPENSAS_XP.derrota;
    const novoNivel = perfil.adicionarXP(xp);
    som(res.venci ? 'vitoria' : 'derrota');
    filaEl.style.display = 'none';
    const caixa = document.createElement('div');
    caixa.className = 'sobreposicao';
    caixa.innerHTML = `
      <div class="caixa-fim">
        <h2 class="${res.venci ? 'vitoria' : 'derrota'}">${res.venci ? 'VITÓRIA ARCANA!' : 'DERROTA…'}</h2>
        <p>Placar: ${res.placar.join(' — ')}${res.desistencia ? ' (por desistência)' : ''} · modo ${res.modo}</p>
        ${res.modo === 'ranqueado' ? `<div class="resultado-elo">${res.deltaElo >= 0 ? '+' : ''}${res.deltaElo} Elo → ★ ${res.rating ?? perfil.dados.rating} (${res.liga ?? ligaDe(perfil.dados.rating)})</div>` : ''}
        <p>+${xp} XP${novoNivel ? ` · NÍVEL ${novoNivel}!` : ''}</p>
        <button class="primario" data-ok>Voltar ao lobby</button>
      </div>`;
    raiz.appendChild(caixa);
    caixa.querySelector('[data-ok]').onclick = () => { caixa.remove(); navegar('#/duelo'); };
  };

  socket.on('entrado', aoEntrado);
  socket.on('emFila', aoEmFila);
  socket.on('dueloEncontrado', aoEncontrado);
  socket.on('fimDuelo', aoFimDuelo);
  socket.on('erroLoadout', aoErroLoadout);
  socket.on('connect', () => { socket.emit('entrar', { nome: perfil.dados.nome || 'Mago Anónimo' }); });
  if (socket.connected) socket.emit('entrar', { nome: perfil.dados.nome || 'Mago Anónimo' });

  botoes.forEach((b) => {
    b.onclick = () => {
      erroEl.textContent = '';
      if (emFila) return;
      const energia = perfil.energiaLoadout();
      if (energia > perfil.energiaMax) {
        erroEl.textContent = `Energia arcana do loadout (${energia}) excede o orçamento (${perfil.energiaMax}). Alivia o grimório.`;
        return;
      }
      som('ui');
      procurarDuelo(b.dataset.modo, perfil.codigosLoadout());
    };
  });
  ecra.querySelector('[data-cancelar]').onclick = () => {
    cancelarProcura();
    emFila = false;
    filaEl.style.display = 'none';
  };

  const sessoesParaLimpar = [];
  return {
    destruir() {
      if (emFila) cancelarProcura();
      sessoesParaLimpar.forEach((s) => s.destruir());
      socket.off('entrado', aoEntrado);
      socket.off('emFila', aoEmFila);
      socket.off('dueloEncontrado', aoEncontrado);
      socket.off('fimDuelo', aoFimDuelo);
      socket.off('erroLoadout', aoErroLoadout);
    },
  };
}

// ── Perfil ──────────────────────────────────────────────────────────────────
export function ecraPerfil(raiz) {
  raiz.appendChild(criarBarraTopo('perfil'));
  const d = perfil.dados;
  const nivel = perfil.nivel;
  const desbloqueados = componentesDesbloqueados(nivel);
  const proximos = proximosDesbloqueios(nivel);
  const ecra = document.createElement('div');
  ecra.className = 'ecra ecra-centro';
  ecra.innerHTML = `
    <h1>${d.nome || 'Mago sem nome'}</h1>
    <p class="subtitulo">Nível ${nivel} · ★ ${d.rating} (${ligaDe(d.rating)})</p>
    <div class="grelha-perfil">
      <div class="cartao-perfil">
        <h3>PROGRESSO</h3>
        <div class="grande">${d.xp} XP</div>
        <div class="sub">${perfil.xpNoNivel}/${perfil.xpPorNivel} para o nível ${nivel + 1}</div>
        <div class="barra-xp" style="width:100%; margin-top:10px;"><div style="width:${(perfil.xpNoNivel / perfil.xpPorNivel) * 100}%"></div></div>
      </div>
      <div class="cartao-perfil">
        <h3>DUELOS</h3>
        <div class="grande">${d.stats.v}V · ${d.stats.d}D</div>
        <div class="sub">Academia: ${d.licoes.length}/${LICOES.length} capítulos concluídos</div>
      </div>
      <div class="cartao-perfil">
        <h3>COMPONENTES DESBLOQUEADOS</h3>
        <div class="chips">${desbloqueados.map((c) => `<span class="chip">${c}</span>`).join('')}
        ${proximos.map((p) => `<span class="chip bloqueado" title="desbloqueia no nível ${p.nivel}">🔒 ${p.componente}</span>`).join('')}</div>
      </div>
      <div class="cartao-perfil">
        <h3>GRIMÓRIO</h3>
        <div class="grande">${d.feiticos.length}</div>
        <div class="sub">feitiços pessoais escritos</div>
      </div>
    </div>`;
  raiz.appendChild(ecra);
  return { destruir() {} };
}
