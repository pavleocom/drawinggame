const gameservice = require('./gameservice.js');

const players = new Array();

var addPlayer = function (name, socket) { 
  console.log('adding player ' + name)
  socket.playerName = name
  socket.playerScore = 0
  players.push(socket)
};

var removePlayer = function (name) { 
  console.log('removing player ' + name)
  var playerIndex = getPlayerNames().indexOf(name);
  players.splice(playerIndex, 1);
};

var getPlayerSocketList = function () { 
  return players
};

var getPlayerNames = function () { 
  return players.map(s => s.playerName)
};

var getPlayerList = function () { 
  return players.map(s => new Player(s.playerName, s.playerScore, gameservice.isPlayerDrawing(s)))
};

class Player {
  constructor(name, score, isDrawing) {
    this.name = name;
    this.score = score;
    this.isDrawing = isDrawing;
  }
}

exports.addPlayer = addPlayer;
exports.removePlayer = removePlayer;
exports.getPlayerSocketList = getPlayerSocketList;
exports.getPlayerNames = getPlayerNames;
exports.getPlayerList = getPlayerList;
