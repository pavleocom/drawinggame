const express = require('express')
const WebSocketServer = require("ws").Server
const path = require('path')
const playerservice = require('./app/playerservice.js');
const gameservice = require('./app/gameservice.js');
const PORT = process.env.PORT || 5000

var app = express()
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'))
  .listen(PORT, () => console.log(`Listening on ${PORT}`))

console.log("http server listening on %d", PORT)

var wss = new WebSocketServer({ server: app })
console.log("websocket server created")

wss.on('connection', function connection(ws) {
  var name = 'Player' + Math.floor(Math.random() * 1000)
  playerservice.addPlayer(name, ws)
  gameservice.playerConnected()

  ws.send(JSON.stringify({
    'type': 'my-player-name',
    'data': name
  }))

  console.log(JSON.stringify(playerservice.getPlayerNames()))

  wss.clients.forEach((client) => {
    client.send(JSON.stringify({
      'type': 'players',
      'data': playerservice.getPlayerNames()
    }));
  });

  ws.on('message', function incoming(messageString) {
    var message = JSON.parse(messageString);
    switch (message.type) {
      case 'coordinates':
        if (gameservice.isPlayerDrawing(ws)) {
          wss.clients.forEach((client) => {
            client.send(JSON.stringify({
              'type': 'coordinates',
              'data': message.data
            }));
          });
        }
        break;
      case 'chat':
        if (gameservice.playerGuess(ws.playerName, message.data)) {
          wss.clients.forEach((client) => {
            client.send(JSON.stringify({
              'type': 'player-correct-guess',
              'data': {
                'name': ws.playerName
              }
            }));
          })
        } else {
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
        break;
      case 'clear-canvas':
        if (gameservice.isPlayerDrawing(ws)) {
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
    playerservice.removePlayer(ws.playerName);
  });

});

