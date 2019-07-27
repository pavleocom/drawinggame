const players = new Array();

var addPlayer = function (name, socket) { 
  console.log('adding player ' + name)
  socket.playerName = name
  players.push(socket)
};

var removePlayer = function (name) { 
  console.log('removing player ' + name)
  var playerIndex = getPlayerNames().indexOf(name);
  players.splice(playerIndex, 1);
};

var getPlayers = function () { 
  return players
};

var getPlayerNames = function () { 
  return players.map(s => s.playerName)
};

exports.addPlayer = addPlayer;
exports.removePlayer = removePlayer;
exports.getPlayers = getPlayers;
exports.getPlayerNames = getPlayerNames;