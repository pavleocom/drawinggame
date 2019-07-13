var websocket = new WebSocket(getWebSocketUrl(), "protocolOne");
var mousedown = false;
var prevX;
var prevY;

var canvas = document.getElementById('canvas');

canvas.addEventListener("mousemove", function (e) {
  currX = e.offsetX;
  currY = e.offsetY;
  if (mousedown) {
    if (!prevX) {
      prevX = currX;
      prevY = currY;
    }
    websocket.send(
      JSON.stringify({
        prevX: prevX,
        prevY: prevY,
        currX: currX,
        currY: currY
      }));
    draw(prevX, prevY, currX, currY);
  }
  prevX = currX;
  prevY = currY;
});
canvas.addEventListener("mousedown", function (e) {
  mousedown = true;
});
canvas.addEventListener("mouseup", function (e) {
  mousedown = false
});
canvas.addEventListener("mouseout", function (e) {
  prevX = null
  prevY = null
});

function draw(prevX, prevY, currX, currY) {
  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');
  ctx.beginPath();
  ctx.moveTo(prevX, prevY);
  ctx.lineTo(currX, currY);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.closePath();
}

websocket.onmessage = function (e) {
  var message = JSON.parse(e.data)
  switch (message.type) {
    case 'coordinates':
        var coords = JSON.parse(message.data);
        draw(coords.prevX, coords.prevY, coords.currX, coords.currY);
        break;
    case 'players':
        updatePlayersList(message.data)
        break;
  }
  
}

function updatePlayersList(list) {
  var playersColumn = document.getElementById('playerslist');
  while (playersColumn.firstChild) {
    playersColumn.removeChild(playersColumn.firstChild);
  }

  list.forEach(function(elm) {
    var div = document.createElement('div');
    var text = document.createTextNode(elm);
    div.appendChild(text);
    playersColumn.appendChild(div);
  });



}

function getWebSocketUrl() {
  return location.origin.replace("https", "wss").replace("http", "ws");
}
