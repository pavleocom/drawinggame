const express = require('express')
const WebSocketServer = require("ws").Server
const path = require('path')
const cookieParser = require('cookie-parser');
const playerservice = require('./app/playerservice.js');
const gameservice = require('./app/gameservice.js');
const historyservice = require('./app/historyservice.js');
const PORT = process.env.PORT || 5000;

var app = express()
  .use(express.static(path.join(__dirname, 'public')))
  .use(cookieParser())
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => {
    if (req.cookies.playerName) {
      res.render('pages/index')
    } else {
      res.redirect('/name')
    }
  })
  .get('/name', (req, res) => res.render('pages/name'))
  .listen(PORT, () => console.log(`Listening on ${PORT}`))

var wss = new WebSocketServer({ server: app })
wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(messageString) {
    var message = JSON.parse(messageString);
    switch (message.type) {
      case 'player-join':
        broadcastPlayerConnected(message.data);
        var id = Math.floor(Math.random() * 1000000000)
        playerservice.addPlayer(id, message.data, ws)
        gameservice.playerConnected(ws)

        sendHistory(ws);
        sendMyPlayerId(ws, id);
        broadcastPlayerList();
        break;
      case 'coordinates':
        if (gameservice.isPlayerDrawing(ws)) {
          historyservice.add(message.data);
          wss.clients.forEach((client) => {
            client.send(JSON.stringify({
              'type': 'coordinates',
              'data': message.data
            }));
          });
        }
        break;
      case 'chat':
        if (!gameservice.isPlayerDrawing(ws)) {
          var guessedCorrectly = gameservice.playerGuess(ws, message.data);
          if (!guessedCorrectly) {
            wss.clients.forEach((client) => {
              client.send(JSON.stringify({
                'type': 'chat',
                'data': {
                  'name': ws.playerName,
                  'message': message.data
                }
              }));
            });
          }
        }
        break;
      case 'clear-canvas':
        if (gameservice.isPlayerDrawing(ws)) {
          historyservice.clearAll();
          wss.clients.forEach((client) => {
            client.send(JSON.stringify({
              'type': 'clear-canvas'
            }));
          });
        }
        break;
      default:
        console.log(message);
    }
  });

  ws.on('close', function incoming() {
    playerservice.removePlayer(ws.playerId);
    gameservice.playerDisconnected(ws.playerId);
    broadcastPlayerList();
    broadcastPlayerDisconnected(ws.playerName);
  });

});

var broadcastPlayerList = function () {
  wss.clients.forEach((client) => {
    client.send(JSON.stringify({
      'type': 'players',
      'data': playerservice.getPlayerList()
    }));
  });
}

var broadcastPlayerConnected = function (playerName) {
  wss.clients.forEach((client) => {
    client.send(JSON.stringify({
      'type': 'player-connected',
      'data': playerName
    }));
  });
}

var broadcastPlayerDisconnected = function (playerName) {
  wss.clients.forEach((client) => {
    client.send(JSON.stringify({
      'type': 'player-disconnected',
      'data': playerName
    }));
  });
}

var sendMyPlayerId = function (ws, id) {
  ws.send(JSON.stringify({
    'type': 'my-player-id',
    'data': id
  }))
}

var sendHistory = function (ws) {
  var history = historyservice.getHistory();

  history.forEach((coordinates) => {
    ws.send(JSON.stringify({
      'type': 'coordinates',
      'data': coordinates
    }))
  });
}