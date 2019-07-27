const playerservice = require('./playerservice.js');
const fs = require('fs')

var wordList = getWordList("words.txt");
var gameInProgress = false;
var drawingPlayerSocket;
var secretWord;

var playerConnected = function () {
  console.log(playerservice.getPlayers().length);
  if (!gameInProgress && playerservice.getPlayers().length >= 2) {
    startGame();
  }
}

var startGame = function () {
  console.log("game started");
  gameInProgress = true;
  nextTurn();
};

var nextTurn = function() {
  secretWord = getNewSecretWord(wordList);
  var players = playerservice.getPlayers();
  if(drawingPlayerSocket == null ) {
    drawingPlayerSocket = players[0];
  } else {
    console.log('index!!: ' + ((playerservice.getPlayerNames().indexOf(drawingPlayerSocket.playerName) + 1) % players.length));
    drawingPlayerSocket = players[(playerservice.getPlayerNames().indexOf(drawingPlayerSocket.playerName) + 1) % players.length];
  }
  console.log("drawing: " + drawingPlayerSocket.playerName);
  players.forEach(function(ws) {
    ws.send(JSON.stringify({
      'type': 'drawing-player-name',
      'data': drawingPlayerSocket.playerName
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
    nextTurn();
    return true;
  }
  return false;
}

var isPlayerDrawing = function(socket) {
  return drawingPlayerSocket && drawingPlayerSocket.playerName === socket.playerName;
}

var stopGame = function () {
  gameInProgress = false;
};

function getWordList(filename) {
  var readWordList = fs.readFileSync(filename, 'utf-8').split('\n');
  var wordList = [];

  readWordList.forEach(function (word) {
    wordList.push(word);
  });

  return wordList;
}

function getNewSecretWord(wordList) {
  var secretWordIndex = Math.floor(Math.random() * wordList.length)
  var secretWord = wordList[secretWordIndex];
  console.log("Secret word: " + secretWord);
  return secretWord;
}

exports.playerConnected = playerConnected;
exports.playerGuess = playerGuess;
exports.isPlayerDrawing = isPlayerDrawing;


