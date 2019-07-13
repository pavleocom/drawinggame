const express = require('express')
const WebSocketServer = require("ws").Server
const path = require('path')
const playerservice = require('./app/playerservice.js');
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
  var name = Math.floor(Math.random() * 1000)
  playerservice.addPlayer(name, ws)

  var playersList = Array.from(playerservice.getPlayers().keys())
  console.log(JSON.stringify(playersList))
  
  wss.clients.forEach((client) => {
    client.send(JSON.stringify({
      'type': 'players',
      'data': playersList
    }));
    
  });

  ws.on('message', function incoming(message) {
    wss.clients.forEach((client) => {
      client.send(JSON.stringify({
        'type': 'coordinates',
        'data': message
        }));
    });
  });

  ws.on('close', function incoming() {
    playerservice.removePlayer(ws.playerName);
  });

});
