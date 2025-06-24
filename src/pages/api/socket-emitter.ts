import type { NextApiRequest, NextApiResponse } from 'next';
import type { NextApiResponseWithSocket } from './socket';

const socketEmitterHandler = (req: NextApiRequest, res: NextApiResponseWithSocket) => {
    if (req.method !== 'POST') {
        res.status(405).json({ message: 'Method Not Allowed' });
        return;
    }

    try {
        const { userId, message } = req.body;

        if (!userId || !message) {
            res.status(400).json({ message: 'userId and message are required' });
            return;
        }

        const io = res.socket.server.io;
        if (io) {
            const roomName = `user-${userId}`;
            console.log(`[SOCKET_EMITTER] Emitiendo 'new-message' a la sala: ${roomName}`);
            io.to(roomName).emit('new-message', message);
            res.status(200).json({ success: true, message: `Evento emitido a ${roomName}` });
        } else {
            console.error('[SOCKET_EMITTER] El servidor de Socket.IO no está inicializado.');
            res.status(500).json({ success: false, message: 'Socket.IO server not initialized' });
        }
    } catch (error) {
        console.error('[SOCKET_EMITTER] Error al emitir el evento:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export default socketEmitterHandler; 