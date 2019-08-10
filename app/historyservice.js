var coordinatesList = [];

var add = function (coordinates) {
  coordinatesList.push(coordinates);
};

var clearAll = function () {
  coordinatesList = [];

};

var getHistory = function () {
  return coordinatesList;
};

exports.add = add;
exports.clearAll = clearAll;
exports.getHistory = getHistory;