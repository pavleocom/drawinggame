const playerservice = require('./playerservice.js');
const historyservice = require('./historyservice.js');
const fs = require('fs')

var wordList = getWordList("words.txt");
var gameInProgress = false;
var drawingPlayerSocket;
var secretWord;
var secretWordHint;
var interval;
var timeout;
var countdown;
var playersGuessedSet = new Set();
var previousDrawingPlayerId;
var previousSecretWord;

var playerConnected = function (socket) {
  if (!gameInProgress && playerservice.getPlayerSocketList().length >= 2) {
    startGame();
  } else if (gameInProgress) {
    socket.send(JSON.stringify({
      'type': 'secret-word',
      'data': secretWordHint
    }))
  }
}

var playerDisconnected = function (playerId) {
  console.log(playerId + " disconnected");
  if (gameInProgress && playerservice.getPlayerSocketList().length <= 1) {
    stopGame();
  } else if (gameInProgress && drawingPlayerSocket.playerId === playerId) {
    nextTurn();
  }
}

var startGame = function () {
  console.log("Game started");
  gameInProgress = true;
  nextTurn();
};

var nextTurn = function () {
  previousSecretWord = secretWord;
  previousDrawingPlayer = drawingPlayerSocket == null ? null : drawingPlayerSocket.playerName;
  secretWord = getNewSecretWord(wordList);
  secretWordHint = getSecretWordHint(secretWord);
  historyservice.clearAll();
  playersGuessedSet = new Set();
  var players = playerservice.getPlayerSocketList();
  if (drawingPlayerSocket == null) {
    drawingPlayerSocket = players[0];
  } else {
    console.log('Drawing player index: ' + ((playerservice.getPlayerIds().indexOf(drawingPlayerSocket.playerId) + 1) % players.length));
    drawingPlayerSocket = players[(playerservice.getPlayerIds().indexOf(drawingPlayerSocket.playerId) + 1) % players.length];
  }
  console.log("Drawing player id: " + drawingPlayerSocket.playerId);
  players.forEach(function (ws) {
    ws.send(JSON.stringify({
      'type': 'drawing-player',
      'data': {
        'id': drawingPlayerSocket.playerId,
        'name': drawingPlayerSocket.playerName
      }
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
  broadcastPlayerList();
  if (interval) {
    stopCountdown(interval);
  }
  broadcastRoundInfo(previousDrawingPlayer, previousSecretWord, drawingPlayerSocket.playerName);
  timeout = setTimeout(function () {
    broadcastClearRoundInfo(); 
    startCountdown(); 
  }, 5000)
}

var playerGuess = function (ws, guess) {
  if (isGuessCorrect(guess, secretWord) && playersGuessedSet.has(ws.playerId)) {
    console.log(ws.playerId + " has already guessed the word");
    return true;
  } else if (isGuessCorrect(guess, secretWord)) {
    console.log(ws.playerId + " guessed correctly");
    addPoints(ws, drawingPlayerSocket);
    playersGuessedSet.add(ws.playerId);
    playerservice.getPlayerSocketList().forEach((client) => {
      client.send(JSON.stringify({
        'type': 'player-correct-guess',
        'data': {
          'id': ws.playerName
        }
      }));
    })
    if (allPlayersGuessed()) {
      nextTurn();
    }
    broadcastPlayerList();
    return true;
  }
  return false;
}

var isGuessCorrect = function (guess, secretWord) {
  return secretWord && guess.replace(" ", "").toLowerCase() === secretWord.replace(" ", "").toLowerCase();
}

var allPlayersGuessed = function () {
  for (const [index, playerId] of playerservice.getPlayerIds().entries()) {
    if (playerId !== drawingPlayerSocket.playerId && !playersGuessedSet.has(playerId)) {
      return false;
    }
  }
  return true;
}

var addPoints = function (playerGuessedSocket, drawingPlayerSocket) {
  playerGuessedSocket.playerScore += countdown * 2;
  drawingPlayerSocket.playerScore += Math.floor(countdown / 2);
}

var isPlayerDrawing = function (socket) {
  return drawingPlayerSocket && drawingPlayerSocket.playerId === socket.playerId;
}

var stopGame = function () {
  gameInProgress = false;
  drawingPlayerSocket = null;
  secretWord = null;
  clearTimeout(timeout);
  playerservice.getPlayerSocketList().forEach(function (ws) {
    ws.send(JSON.stringify({
      'type': 'drawing-player-id',
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

var broadcastPlayerList = function () {
  playerservice.getPlayerSocketList().forEach((socket) => {
    socket.send(JSON.stringify({
      'type': 'players',
      'data': playerservice.getPlayerList()
    }));
  });
}

var broadcastClock = function () {
  playerservice.getPlayerSocketList().forEach((socket) => {
    socket.send(JSON.stringify({
      'type': 'clock',
      'data': countdown
    }));
  });
}

var broadcastRoundInfo = function (previousPlayerDrawing, previousSecretWord, nextPlayerDrawing) {
  console.log("lalala: " + previousSecretWord + ' ' + previousPlayerDrawing);
  playerservice.getPlayerSocketList().forEach((socket) => {
    socket.send(JSON.stringify({
      'type': 'show-round-info',
      'data': {
        'previous-player-drawing': previousPlayerDrawing,
        'previous-secret-word': previousSecretWord,
        'next-player-drawing': nextPlayerDrawing
      }
    }));
  });
}

var broadcastClearRoundInfo = function () {
  playerservice.getPlayerSocketList().forEach((socket) => {
    socket.send(JSON.stringify({
      'type': 'hide-round-info'
    }));
  });
}

var getDrawingPlayersId = function () {
  if (!drawingPlayerSocket) {
    return null;
  }
  return drawingPlayerSocket.playerId;
}

var startCountdown = function () {
  console.log('start countdown');
  countdown = 90;
  broadcastClock(countdown);
  interval = setInterval(function () {
    onCountdownTick(this)

  }, 1000);
}

var onCountdownTick = function (intervalHandler) {
  countdown--;
  broadcastClock(countdown);
  if (countdown <= 0) {
    stopCountdown(intervalHandler);
    nextTurn();
  }
}

var stopCountdown = function (intervalHandler) {
  console.log('stoppping yooooo');
  clearInterval(intervalHandler);
}

exports.playerConnected = playerConnected;
exports.playerDisconnected = playerDisconnected;
exports.playerGuess = playerGuess;
exports.isPlayerDrawing = isPlayerDrawing;
exports.getDrawingPlayersId = getDrawingPlayersId;


