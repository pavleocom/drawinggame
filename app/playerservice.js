const playersMap = new Map();

var addPlayer = function (name, socket) { 
  console.log('adding player ' + name)
  socket.playerName = name
  playersMap.set(name)
};

var removePlayer = function (name) { 
  console.log('removing player ' + name)
  playersMap.delete(name)
};

var getPlayers = function (name) { 
  return playersMap
};

var getPlayerNameForSocket = function (socket) { 
  return Object.keys(playersMap).find(key => playersMap[key] === socket);
};

exports.addPlayer = addPlayer;
exports.removePlayer = removePlayer;
exports.getPlayers = getPlayers;
exports.getPlayerNameForSocket = getPlayerNameForSocket;