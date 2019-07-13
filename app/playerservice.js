module.exports.addPlayer = function (name, socket) { 
  console.log('adding player ' + name)
  playersMap.set(name, socket)
};

module.exports.removingPlayer = function (name) { 
  console.log('removing player' + name)
};

module.exports.getPlayers = function (name) { 
  return playersMap
};

module.exports.getPlayerNameForSocket = function (socket) { 
  return Object.keys(playersMap).find(key => playersMap[key] === socket);
};

const playersMap = new Map();