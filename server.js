import WebSocket, { WebSocketServer } from 'ws';
import { createServer } from 'http';
import logger from './logger.js';

const server = createServer();
const wss = new WebSocketServer({server});

const clients = new Map();

logger.info('Servidor WebSocket iniciado en el puerto 8080');

function broadcast(data, sender) {
  clients.forEach((clientData, client) => {
    // If not the same client and the websocket connection is open send the data
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(data);
      } catch (error) {
        logger.error('Error enviando mensaje: ', error);
        clients.delete(client);
      }
    } else {
      clients.delete(client);
    }
  });
}

wss.on('connection', (ws) => {
  logger.info('Nueva conexión WebSocket establecida');

  clients.set(ws, {
    username: null,
    connectedAt: new Date(),
  });

  // Mensajes de cliente a servidor
  ws.on('message', (message) => {
    const data = JSON.parse(message);
    //logger.info('Received message:', data);

    const clientData = clients.get(ws);

    if (data.type === 'user_joined') {
      clientData.username = data.username;

      broadcast(JSON.stringify({
        type: 'user_joined',
        message: `${data.username} se ha conectado`,
        timestamp: new Date().toISOString(),
        totalUsers: clients.size,
        username: data.username,
      }), ws);

    } else if (data.type === 'chat_message') {
      broadcast(JSON.stringify({
        type: 'message',
        message: data.message,
        timestamp: new Date().toISOString(),
        totalUsers: clients.size,
        username: clientData.username || data.username,
      }), ws);
    }

  });

  // Mensajes de servidor a cliente
  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'Bienvenido al servidor WebSocket',
    timestamp: new Date().toISOString(),
    totalUsers: clients.size,
    username: 'Servidor',
  }));

  ws.on('error', (error) => {
    logger.error('WebSocket error:', error);
  });

  ws.on('close', () => {
    const clientData = clients.get(ws);
    logger.info('Client disconnected');
    clients.delete(ws);

    broadcast(JSON.stringify({
      type: 'user_left',
      message: `${clientData.username} se ha desconectado`,
      timestamp: new Date().toISOString(),
      totalUsers: clients.size,
      username: 'Servidor',
    }), ws);
  });
});

server.listen(8080);