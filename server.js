import WebSocket, { WebSocketServer } from 'ws';
import { createServer } from 'http';
import logger from './logger.js';

const server = createServer();
const wss = new WebSocketServer({server});
const clients = new Map();

const messageHistory = [];
const MAX_HISTORY = 50;

logger.info('🚀 Servidor WebSocket iniciado en el puerto 8080');

function broadcast(data, sender) {
  clients.forEach((clientData, client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(data);
        logger.debug(`✅ Mensaje enviado exitosamente a ${clientData.username ||
        'cliente anónimo'}`);
      } catch (error) {
        logger.error(`❌ Error enviando mensaje a ${clientData.username ||
        'cliente anónimo'}:`, error.message);
        clients.delete(client);
      }
    } else {
      clients.delete(client);
    }
  });

  logger.info(`📊 Clientes activos después del broadcast: ${clients.size}`);
}

wss.on('connection', (ws) => {
  clients.set(ws, {
    username: null,
    connectedAt: new Date(),
  });

  // Mensajes de cliente a servidor
  ws.on('message', (message) => {
    const clientData = clients.get(ws);

    try {
      const data = JSON.parse(message);

      if (data.type === 'user_joined') {
        logger.info(`📨 MENSAJE RECIBIDO: Nuevo usuario conectándose (${data.username})`);
        logger.info(`👤 USUARIO SE UNE: ${data.username}`);
        clientData.username = data.username;

        // Mensaje de bienvenida
        const welcomeMessage = {
          type: 'welcome',
          message: `Bienvenido ${data.username} al servidor WebSocket`,
          timestamp: new Date().toISOString(),
          totalUsers: clients.size,
          username: 'Servidor',
        };

        logger.info(`👋 Enviando mensaje de bienvenida a ${data.username}`);
        ws.send(JSON.stringify(welcomeMessage));

        // Enviar historial al nuevo usuario
        if (messageHistory.length > 0) {
          logger.info(`📚 Enviando historial de ${messageHistory.length} mensajes a ${data.username}`);
          ws.send(JSON.stringify({
            type: 'message_history',
            messages: messageHistory,
            timestamp: new Date().toISOString(),
          }));
        }

        // Notificar a otros usuarios que se unió alguien nuevo
        const joinMessage = {
          type: 'user_joined',
          message: `${data.username} se ha conectado`,
          timestamp: new Date().toISOString(),
          totalUsers: clients.size,
          username: data.username,
        };

        logger.info(`📢 Notificando conexión de ${data.username} a todos los clientes`);
        broadcast(JSON.stringify(joinMessage), ws);

      } else if (data.type === 'chat_message') {
        logger.info(`📨 MENSAJE RECIBIDO de ${clientData.username}`);
        logger.info(`💬 MENSAJE DE CHAT de ${clientData.username}: "${data.message}"`);

        const chatMessage = {
          type: 'message',
          message: data.message,
          timestamp: new Date().toISOString(),
          totalUsers: clients.size,
          username: clientData.username || data.username,
        };

        messageHistory.push(chatMessage);
        logger.info(`📝 Mensaje agregado al historial (${messageHistory.length}/${MAX_HISTORY})`);

        if (messageHistory.length > MAX_HISTORY) {
          // Elimina el mensaje más antiguo si se supera el límite
          messageHistory.shift();
        }

        logger.info(`📡 Broadcasting mensaje de ${clientData.username} a todos los clientes`);
        broadcast(JSON.stringify(chatMessage), ws);
      }

    } catch (error) {
      logger.error('Error procesando mensaje:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Error procesando el mensaje',
        timestamp: new Date().toISOString(),
      }));
    }
  });

  ws.on('error', (error) => {
    logger.error('WebSocket error:', error);
  });

  ws.on('close', () => {
    const clientData = clients.get(ws);
    logger.info(`🔌 DESCONEXIÓN: ${clientData?.username}`);
    clients.delete(ws);

    if (clientData?.username) {
    const disconnectMessage = {
      type: 'user_left',
      message: `${clientData.username} se ha desconectado`,
      timestamp: new Date().toISOString(),
      totalUsers: clients.size,
      username: 'Servidor',
    };

      logger.info(`📢 Notificando desconexión de ${clientData.username} a todos los clientes`);
    broadcast(JSON.stringify(disconnectMessage), ws);
    }
  });
});

server.listen(8080);