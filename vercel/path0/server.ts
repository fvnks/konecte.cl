// server.ts
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import express from 'express';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '9002', 10);

const app = next({ dev });
const handle = app.getRequestHandler();

const expressApp = express();

// Middleware
expressApp.use(cors({
    origin: "*", // IMPORTANT: Restrict this in production to your frontend's domain
}));
expressApp.use(express.json());

const server = createServer(expressApp);

const io = new SocketIOServer(server, {
    cors: {
        origin: "*", // IMPORTANT: Restrict this in production
        methods: ["GET", "POST"]
    }
});

// Store connected clients
const connectedClients: Record<string, any> = {};

io.on('connection', (socket) => {
    const userPhone = socket.handshake.query.userPhone as string;
    console.log(`[Socket.IO] Client connected: ${socket.id} for user phone: ${userPhone}`);

    if (userPhone) {
        connectedClients[userPhone] = socket;
        console.log(`[Socket.IO] Socket registered for phone: ${userPhone}`);
    }

    socket.on('disconnect', () => {
        console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
        for (const phone in connectedClients) {
            if (connectedClients[phone].id === socket.id) {
                delete connectedClients[phone];
                console.log(`[Socket.IO] Socket for phone ${phone} deregistered.`);
                break;
            }
        }
    });
});

// API endpoint for bot replies
expressApp.post('/api/bot-reply', (req, res) => {
    const { targetUserWhatsAppNumber, messageText } = req.body;
    console.log(`[API /bot-reply] Received reply for ${targetUserWhatsAppNumber}: "${messageText}"`);

    if (!targetUserWhatsAppNumber || !messageText) {
        console.warn('[API /bot-reply] Missing targetUserWhatsAppNumber or messageText.');
        return res.status(400).json({ error: 'Faltan los parámetros targetUserWhatsAppNumber o messageText' });
    }

    const clientSocket = connectedClients[targetUserWhatsAppNumber];

    if (clientSocket) {
        console.log(`[API /bot-reply] Found active socket for ${targetUserWhatsAppNumber}. Emitting 'bot-response'.`);
        clientSocket.emit('bot-response', {
            text: messageText,
            sender: 'bot',
            timestamp: new Date().toISOString()
        });
        res.status(200).json({ success: true, message: 'Mensaje reenviado al cliente vía WebSocket.' });
    } else {
        console.warn(`[API /bot-reply] No active socket found for ${targetUserWhatsAppNumber}.`);
        res.status(404).json({ success: false, message: 'El cliente no está conectado por WebSocket.' });
    }
});

app.prepare().then(() => {
    // Handle all other requests with Next.js
    expressApp.all('*', (req, res) => {
        const parsedUrl = parse(req.url!, true);
        return handle(req, res, parsedUrl);
    });

    server.listen(port, (err?: any) => {
        if (err) throw err;
        console.log(`> Konecte custom server ready on http://localhost:${port}`);
    });
});
