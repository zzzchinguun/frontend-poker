import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || 'http://localhost:3001';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    console.log('[Socket] Creating new socket instance to:', SOCKET_URL);
    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
}

export function connectSocket(token: string): Socket {
  const s = getSocket();
  console.log('[Socket] Connecting with token:', token ? `${token.slice(0, 20)}...` : 'NO TOKEN');
  s.auth = { token };
  s.connect();
  return s;
}

export function disconnectSocket(): void {
  if (socket) {
    console.log('[Socket] Disconnecting socket');
    socket.disconnect();
  }
}

export function getSocketStatus(): { connected: boolean; id: string | null } {
  return {
    connected: socket?.connected ?? false,
    id: socket?.id ?? null,
  };
}
