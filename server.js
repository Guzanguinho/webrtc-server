const express = require('express');
const WebSocket = require('ws');
const app = express();
const server = require('http').createServer(app);
const wss = new WebSocket.Server({ server });

let broadcaster = null;
const viewers = new Set();

wss.on('connection', (socket) => {
  socket.on('message', (message) => {
    const data = JSON.parse(message);

    if (data.type === 'broadcaster') {
      broadcaster = socket;
      socket.isBroadcaster = true;
    } else if (data.type === 'viewer') {
      viewers.add(socket);
      socket.isViewer = true;
      if (broadcaster) {
        broadcaster.send(JSON.stringify({ type: 'viewer-connected' }));
      }
    } else if (data.type === 'offer' || data.type === 'answer' || data.type === 'candidate') {
      const targetSocket = data.to === 'broadcaster' ? broadcaster : [...viewers][0];
      if (targetSocket) {
        targetSocket.send(JSON.stringify(data));
      }
    } else if (data.type === 'identify') {
      socket.id = data.id;
    }
  });

  socket.on('close', () => {
    if (socket.isViewer) viewers.delete(socket);
    if (socket === broadcaster) broadcaster = null;
  });
});

app.get('/', (req, res) => res.send('Servidor WebRTC rodando!'));

server.listen(process.env.PORT || 3000, () => {
  console.log('Servidor WebRTC rodando na porta ' + (process.env.PORT || 3000));
});

