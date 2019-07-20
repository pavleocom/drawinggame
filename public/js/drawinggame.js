var websocket = new WebSocket(getWebSocketUrl(), "protocolOne");
var mousedown = false;
var prevX;
var prevY;
var colour = '#000';

var chatboxOutput = document.getElementById('chatbox-output');
var canvas = document.getElementById('canvas');
var colourBtns = document.querySelectorAll('.colour-btn');

colourBtns.forEach(function(btn) {
  btn.addEventListener('click', function(e) {
    colour = this.dataset.colour;
  }.bind(btn))
})

document.getElementById('clear_canvas_btn').addEventListener('click', function(e) {
  websocket.send(
    JSON.stringify({
      'type': 'clear-canvas'
    }));
})

document.getElementById('message_form').addEventListener('submit', function(e) {
  e.preventDefault();
  var message_input = document.getElementById('message');
  var message = message_input.value;
  message_input.value = '';
  websocket.send(
    JSON.stringify({
      'type': 'chat',
      'data': message
    }));
})

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
        'type': 'coordinates',
        'data': {
          prevX: prevX,
          prevY: prevY,
          currX: currX,
          currY: currY,
          colour: colour
        }
      }));
    draw(prevX, prevY, currX, currY, colour);
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

function draw(prevX, prevY, currX, currY, colour) {
  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');
  ctx.beginPath();
  ctx.moveTo(prevX, prevY);
  ctx.lineTo(currX, currY);
  ctx.strokeStyle = colour;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.closePath();
}

function clearCanvas() {
  canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
}

websocket.onmessage = function (e) {
  var message = JSON.parse(e.data)
  switch (message.type) {
    case 'coordinates':
        var coords = message.data;
        draw(coords.prevX, coords.prevY, coords.currX, coords.currY, coords.colour);
        break;
    case 'players':
        updatePlayersList(message.data)
        break;
    case 'chat':
        printChatMessage(message.data)
        break;
    case 'clear-canvas':
        clearCanvas()
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

function printChatMessage(message) {
  var paragraphNode = document.createElement('p');
  var messageTextNode = document.createTextNode(message);
  paragraphNode.appendChild(messageTextNode);
  chatboxOutput.appendChild(paragraphNode);
}
