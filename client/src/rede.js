// Ligação de rede ao servidor autoritativo (Socket.IO).
// VITE_SERVIDOR_URL permite alojar o cliente na Vercel e o servidor no Render;
// sem a variável, liga à mesma origem (deployment de serviço único no Render).
import { io } from 'socket.io-client';

const URL_SERVIDOR = import.meta.env.VITE_SERVIDOR_URL || undefined;

let socket = null;

export function obterSocket() {
  if (socket) return socket;
  socket = io(URL_SERVIDOR, {
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 5,
  });
  return socket;
}

export function fecharSocket() {
  if (socket) { socket.disconnect(); socket = null; }
}

// Pede um duelo ao matchmaking. devolve via eventos do socket:
// 'entrado', 'emFila', 'dueloEncontrado', 'estado', 'fimDuelo', 'erroLoadout'
export function entrar(nome) {
  const s = obterSocket();
  s.emit('entrar', { nome });
  return s;
}

export function procurarDuelo(modo, loadout) {
  obterSocket().emit('procurarDuelo', { modo, loadout });
}

export function cancelarProcura() {
  obterSocket().emit('cancelarProcura');
}
