const gameservice = require('./gameservice.js');

const players = new Array();

var addPlayer = function (id, name, socket) { 
  console.log('adding player ' + id)
  socket.playerId = id
  socket.playerName = name;
  socket.playerScore = 0
  players.push(socket)
};

var removePlayer = function (id) { 
  console.log('removing player ' + id)
  var playerIndex = getPlayerIds().indexOf(id);
  players.splice(playerIndex, 1);
};

var getPlayerSocketList = function () { 
  return players
};

var getPlayerIds = function () { 
  return players.map(s => s.playerId)
};

var getPlayerList = function () { 
  return players.map(s => new Player(s.playerId, s.playerName, s.playerScore, gameservice.isPlayerDrawing(s)))
};

class Player {
  constructor(id, name, score, isDrawing) {
    this.id = id;
    this.name = name;
    this.score = score;
    this.isDrawing = isDrawing;
  }
}

exports.addPlayer = addPlayer;
exports.removePlayer = removePlayer;
exports.getPlayerSocketList = getPlayerSocketList;
exports.getPlayerIds = getPlayerIds;
exports.getPlayerList = getPlayerList;
