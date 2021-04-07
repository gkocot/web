const express = require('express');
const app = express();
const server = app.listen(8080);

app.use(express.static(__dirname));

const WebSocket = require('ws');

const webSocketServer = new WebSocket.Server({server});

webSocketServer.on('connection', webSocket => {
  webSocket.on('message', message => {
    //console.log('Received:', message);
    broadcast(message);
  });
});

function broadcast(data) {
  webSocketServer.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}
