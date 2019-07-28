const playerservice = require('./playerservice.js');
const fs = require('fs')

var wordList = getWordList("words.txt");
var gameInProgress = false;
var drawingPlayerSocket;
var secretWord;
var secretWordHint;

var playerConnected = function (socket) {
  if (!gameInProgress && playerservice.getPlayers().length >= 2) {
    startGame();
  } else if (gameInProgress) {
    socket.send(JSON.stringify({
      'type': 'secret-word',
      'data': secretWordHint
    }))
  }
}

var playerDisconnected = function (playerName) {
  console.log(playerName + " disconnected");
  if (gameInProgress && playerservice.getPlayers().length <= 1) {
    stopGame();
  } else if (gameInProgress && drawingPlayerSocket.playerName === playerName) {
    nextTurn();
  }
}

var startGame = function () {
  console.log("Game started");
  gameInProgress = true;
  nextTurn();
};

var nextTurn = function () {
  secretWord = getNewSecretWord(wordList);
  secretWordHint = getSecretWordHint(secretWord);
  var players = playerservice.getPlayers();
  if (drawingPlayerSocket == null) {
    drawingPlayerSocket = players[0];
  } else {
    console.log('Drawing player index: ' + ((playerservice.getPlayerNames().indexOf(drawingPlayerSocket.playerName) + 1) % players.length));
    drawingPlayerSocket = players[(playerservice.getPlayerNames().indexOf(drawingPlayerSocket.playerName) + 1) % players.length];
  }
  console.log("Drawing player name: " + drawingPlayerSocket.playerName);
  players.forEach(function (ws) {
    ws.send(JSON.stringify({
      'type': 'drawing-player-name',
      'data': drawingPlayerSocket.playerName
    }))
  })
  players.forEach(function (ws) {
    ws.send(JSON.stringify({
      'type': 'secret-word',
      'data': secretWordHint
    }))
  })
  drawingPlayerSocket.send(JSON.stringify({
    'type': 'secret-word',
    'data': secretWord
  }));
}

var playerGuess = function (playerName, guess) {
  if (secretWord && guess.replace(" ", "").toLowerCase() === secretWord.replace(" ", "").toLowerCase()) {
    console.log(playerName + " guessed correctly");
    playerservice.getPlayers().forEach((client) => {
      client.send(JSON.stringify({
        'type': 'player-correct-guess',
        'data': {
          'name': playerName
        }
      }));
    })
    nextTurn();
    return true;
  }
  return false;
}

var isPlayerDrawing = function (socket) {
  return drawingPlayerSocket && drawingPlayerSocket.playerName === socket.playerName;
}

var stopGame = function () {
  gameInProgress = false;
  drawingPlayerSocket = null;
  secretWord = null;
  playerservice.getPlayers().forEach(function (ws) {
    ws.send(JSON.stringify({
      'type': 'drawing-player-name',
      'data': 'No one'
    }))
  })
};

function getWordList(filename) {
  var readWordList = fs.readFileSync(filename, 'utf-8').split('\n');
  var wordList = [];

  readWordList.forEach(function (word) {
    wordList.push(word);
  });

  return wordList;
}

function getSecretWordHint(secretWord) {
  if (secretWord == null || secretWord === '') {
    return '';
  }
  var length = secretWord.length;
  var randomLetterIndex = (Math.random() * (length - 1)) + 1;
  var randomLetter = secretWord.charAt(randomLetterIndex);
  var hint = secretWord.replace(/[a-z]/gi, '_');
  hint = hint.substr(0, randomLetterIndex) + randomLetter + hint.substr(randomLetterIndex + 1);
  hint = hint.replace(/(.)/gi, "$1 ");
  return hint;
}

function getNewSecretWord(wordList) {
  var secretWordIndex = Math.floor(Math.random() * wordList.length)
  var secretWord = wordList[secretWordIndex];
  console.log("Secret word: " + secretWord);
  return secretWord;
}

exports.playerConnected = playerConnected;
exports.playerDisconnected = playerDisconnected;
exports.playerGuess = playerGuess;
exports.isPlayerDrawing = isPlayerDrawing;


