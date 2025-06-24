import { Server, Socket } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { Socket as NetSocket } from 'net';

interface SocketServer extends HTTPServer {
  io?: Server;
}

interface SocketWithIO extends NetSocket {
  server: SocketServer;
}

interface NextApiResponseWithSocket extends NextApiResponse {
  socket: SocketWithIO;
}

const socketHandler = (req: NextApiRequest, res: NextApiResponseWithSocket) => {
  if (res.socket.server.io) {
    console.log('[SOCKET.IO] El servidor de Socket ya está en funcionamiento.');
  } else {
    console.log('[SOCKET.IO] Inicializando un nuevo servidor de Socket.IO...');
    const io = new Server(res.socket.server, {
      path: '/api/socket',
      addTrailingSlash: false,
    });
    res.socket.server.io = io;

    io.on('connection', (socket: Socket) => {
      console.log(`[SOCKET.IO] Cliente conectado: ${socket.id}`);

      socket.on('join-room', (userId: string) => {
        if (!userId) return;
        const roomName = `user-${userId}`;
        socket.join(roomName);
        console.log(`[SOCKET.IO] Socket ${socket.id} se unió a la sala: ${roomName}`);
      });

      socket.on('disconnect', () => {
        console.log(`[SOCKET.IO] Cliente desconectado: ${socket.id}`);
      });
    });
  }
  res.end();
};

export default socketHandler; 