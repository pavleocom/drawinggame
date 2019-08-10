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
var previousDrawingPlayerName;
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

var playerDisconnected = function (playerName) {
  console.log(playerName + " disconnected");
  if (gameInProgress && playerservice.getPlayerSocketList().length <= 1) {
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
  previousSecretWord = secretWord;
  previousDrawingPlayerName = drawingPlayerSocket == null ? null : drawingPlayerSocket.playerName;
  secretWord = getNewSecretWord(wordList);
  secretWordHint = getSecretWordHint(secretWord);
  historyservice.clearAll();
  playersGuessedSet = new Set();
  var players = playerservice.getPlayerSocketList();
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
  broadcastPlayerList();
  if (interval) {
    stopCountdown(interval);
  }
  broadcastRoundInfo(previousDrawingPlayerName, previousSecretWord, drawingPlayerSocket.playerName);
  timeout = setTimeout(function () {
    broadcastClearRoundInfo(); 
    startCountdown(); 
  }, 5000)
}

var playerGuess = function (ws, guess) {
  if (isGuessCorrect(guess, secretWord) && playersGuessedSet.has(ws.playerName)) {
    console.log(ws.playerName + " has already guessed the word");
    return true;
  } else if (isGuessCorrect(guess, secretWord)) {
    console.log(ws.playerName + " guessed correctly");
    addPoints(ws, drawingPlayerSocket);
    playersGuessedSet.add(ws.playerName);
    playerservice.getPlayerSocketList().forEach((client) => {
      client.send(JSON.stringify({
        'type': 'player-correct-guess',
        'data': {
          'name': ws.playerName
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
  for (const [index, playerName] of playerservice.getPlayerNames().entries()) {
    if (playerName !== drawingPlayerSocket.playerName && !playersGuessedSet.has(playerName)) {
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
  return drawingPlayerSocket && drawingPlayerSocket.playerName === socket.playerName;
}

var stopGame = function () {
  gameInProgress = false;
  drawingPlayerSocket = null;
  secretWord = null;
  clearTimeout(timeout);
  playerservice.getPlayerSocketList().forEach(function (ws) {
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

var broadcastRoundInfo = function (previousPlayerDrawingName, previousSecretWord, nextPlayerDrawingName) {
  playerservice.getPlayerSocketList().forEach((socket) => {
    socket.send(JSON.stringify({
      'type': 'show-round-info',
      'data': {
        'previous-player-drawing': previousPlayerDrawingName,
        'previous-secret-word': previousSecretWord,
        'next-player-drawing': nextPlayerDrawingName
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

var getDrawingPlayersName = function () {
  if (!drawingPlayerSocket) {
    return null;
  }
  return drawingPlayerSocket.playerName;
}

var startCountdown = function () {
  console.log('start countdown');
  countdown = 91;
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
exports.getDrawingPlayersName = getDrawingPlayersName;


