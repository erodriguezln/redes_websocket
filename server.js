import WebSocket, { WebSocketServer } from 'ws';
import { createServer } from 'http';
import logger from './logger.js';

const server = createServer();

const wss = new WebSocketServer({server});

const clients = new Set();

logger.info('Servidor WebSocket iniciado en el puerto 8080');

function broadcast(data, sender) {
  clients.forEach((client) => {
    // If not the same client and the websocket connection is open send the data
    if (client !== sender && client.readyState === 1) {
      client.send(data);
    }
  });
}

wss.on('connection', (ws) => {
  logger.info('Nueva conexión WebSocket establecida');

  clients.add(ws);
  //console.log(ws);

  ws.on('message', (message) => {
    const data = JSON.parse(message);
    logger.info('Received message:', data);
  });

  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'Bienvenido al servidor WebSocket',
    timestamp: new Date().toISOString(),
    totalUsers: clients.size,
  }));

  ws.on('error', (error) => {
    logger.error('WebSocket error:', error);
  });

  ws.on('close', () => {
    logger.info('Client disconnected');
  });
});

server.listen(8080);