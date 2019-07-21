const express = require('express')
const WebSocketServer = require("ws").Server
const path = require('path')
const fs = require('fs')
const playerservice = require('./app/playerservice.js');
const PORT = process.env.PORT || 5000

var wordList = getWordList("words.txt");
var secretWord = getNewSecretWord(wordList);

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

  var playersList = Array.from(playerservice.getPlayers().keys())
  console.log(JSON.stringify(playersList))

  wss.clients.forEach((client) => {
    client.send(JSON.stringify({
      'type': 'players',
      'data': playersList
    }));
  });

  wss.clients.forEach((client) => {
    client.send(JSON.stringify({
      'type': 'secret-word',
      'data': secretWord
    }));
  });

  ws.on('message', function incoming(messageString) {
    var message = JSON.parse(messageString);
    switch (message.type) {
      case 'coordinates':
        wss.clients.forEach((client) => {
          client.send(JSON.stringify({
            'type': 'coordinates',
            'data': message.data
          }));
        });
        break;
      case 'chat':
        if (message.data == secretWord) {
          secretWord = getNewSecretWord(wordList)
          wss.clients.forEach((client) => {
            client.send(JSON.stringify({
              'type': 'secret-word',
              'data': secretWord
            }))
          })
          wss.clients.forEach((client) => {
            client.send(JSON.stringify({
              'type': 'player-correct-guess',
              'data': {
                'name': ws.playerName
              }
            }));
          });
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
        wss.clients.forEach((client) => {
          client.send(JSON.stringify({
            'type': 'clear-canvas'
          }));
        });
        break;
      default:
        console.log(message);
    }


  });

  ws.on('close', function incoming() {
    playerservice.removePlayer(ws.playerName);
  });

});

function getWordList(filename) {
  var readWordList = fs.readFileSync(filename, 'utf-8').split('\n');
  var wordList = [];

  readWordList.forEach(function (word) {
    wordList.push(word.replace(" ", "").toLowerCase());
  });

  return wordList;
}

function getNewSecretWord(wordList) {
  var secretWordIndex = Math.floor(Math.random() * wordList.length)
  var secretWord = wordList[secretWordIndex];
  console.log("Secret word: " + secretWord);
  return secretWord;
}