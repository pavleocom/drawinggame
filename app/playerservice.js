module.exports.addPlayer = function (name, socket) { 
  console.log('adding player ' + name)
  socket.playerName = name
  playersMap.set(name)
};

module.exports.removePlayer = function (name) { 
  console.log('removing player ' + name)
  playersMap.delete(name)
};

module.exports.getPlayers = function (name) { 
  return playersMap
};

module.exports.getPlayerNameForSocket = function (socket) { 
  return Object.keys(playersMap).find(key => playersMap[key] === socket);
};

const playersMap = new Map();