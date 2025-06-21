// server.ts
import { createServer } from 'http';
import next from 'next';
import express from 'express';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import { query } from './src/lib/db'; // Import DB query function
import type { User } from './src/lib/types'; // Import User type for typing

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '9002', 10);

const app = next({ dev });
const handle = app.getRequestHandler();

const expressApp = express();

// Middleware
expressApp.use(cors({
    origin: "*", // IMPORTANT: Restrict this in production
}));
expressApp.use(express.json());

const server = createServer(expressApp);

const io = new SocketIOServer(server, {
    cors: {
        origin: "*", // IMPORTANT: Restrict this in production
        methods: ["GET", "POST"]
    }
});

// Store connected clients (phone number -> socket)
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
expressApp.post('/api/bot-reply', async (req, res) => {
    const { userId, messageText } = req.body;
    console.log(`[API /bot-reply] Received reply for userId ${userId}: "${messageText}"`);

    if (!userId || !messageText) {
        console.warn('[API /bot-reply] Missing userId or messageText.');
        return res.status(400).json({ error: 'Faltan los parámetros userId o messageText' });
    }
    
    try {
        // Query DB to find the user's phone number from their ID
        const userRows: User[] = await query('SELECT phone_number FROM users WHERE id = ?', [userId]);

        if (userRows.length === 0 || !userRows[0].phone_number) {
            console.error(`[API /bot-reply] Error: User or phone number not found for userId: ${userId}`);
            return res.status(404).json({ success: false, message: `Usuario con ID ${userId} no encontrado o no tiene número de teléfono.` });
        }
        
        const targetUserWhatsAppNumber = userRows[0].phone_number;
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
            console.warn(`[API /bot-reply] No active socket found for ${targetUserWhatsAppNumber}. Message will not be delivered in real-time.`);
            // Even if not connected, we can still say we received it. 
            // The user will get the message history next time they connect.
            res.status(202).json({ success: true, message: 'Mensaje recibido, pero el cliente no está conectado por WebSocket.' });
        }
    } catch(dbError: any) {
        console.error(`[API /bot-reply] Database error for userId ${userId}:`, dbError.message);
        res.status(500).json({ success: false, message: 'Error de base de datos al buscar usuario.' });
    }
});


app.prepare().then(() => {
    // Handle all other requests with Next.js
    expressApp.all('*', (req, res) => {
        const parsedUrl = require('url').parse(req.url!, true);
        return handle(req, res, parsedUrl);
    });

    server.listen(port, (err?: any) => {
        if (err) throw err;
        console.log(`> Konecte custom server ready on http://localhost:${port}`);
    });
}).catch(ex => {
    console.error(ex.stack);
    process.exit(1);
});
