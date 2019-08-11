var websocket = new WebSocket(getWebSocketUrl(), "protocolOne");
var mousedown = false;
var myPlayerId;
var drawingPlayerId;
var prevX;
var prevY;
var colour = '#000';
var lineWidth = '5';

var chatboxOutput = document.getElementById('chatbox-output');
var canvas = document.getElementById('canvas');
var colourBtns = document.querySelectorAll('.colour-btn');
var lineWidthInput = document.getElementById('line-width');
var clockElement = document.getElementById('clock');
var chatInput = document.getElementById('message');
var canvasOverlay = document.getElementById('canvas-overlay');
var roundInfoPreviousPlayerDrawing = document.querySelector('.last-player-drawing');
var roundInfoNextPlayerDrawing = document.querySelector('.next-player-drawing');
var roundInfoPreviousWord = document.querySelector('.last-word');
var previousRoundContainer = document.querySelector('.previous-round-container');
var svg = document.getElementById('svg');
var circle = document.getElementById('circle');

changeCursor();

websocket.onopen = function () {
  console.log(getCookie('playerName'));
  websocket.send(JSON.stringify({
    'type': 'player-join',
    'data': getCookie('playerName')
  }));
};

lineWidthInput.addEventListener('change', function (e) {
  lineWidth = lineWidthInput.value;
  changeCursor();
})

canvas.addEventListener('dblclick', function (event) {
  window.getSelection().removeAllRanges();
});

canvas.addEventListener('mouseover', function (event) {
  window.getSelection().removeAllRanges();
});

window.addEventListener('mouseup', function (e) {
  mousedown = false;
})

colourBtns.forEach(function (btn) {
  btn.addEventListener('click', function (e) {
    colour = this.dataset.colour;
    changeCursor();
  }.bind(btn))
})

document.getElementById('clear-canvas-btn').addEventListener('click', function (e) {
  websocket.send(
    JSON.stringify({
      'type': 'clear-canvas'
    }));
})

document.getElementById('message_form').addEventListener('submit', function (e) {
  e.preventDefault();
  var message_input = document.getElementById('message');
  var message = message_input.value;
  if (message) {
    message_input.value = '';
    websocket.send(JSON.stringify({
      'type': 'chat',
      'data': message
    }));
  }
})

canvas.addEventListener("mousemove", function (e) {
  if (myPlayerId === drawingPlayerId) {
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
            colour: colour,
            lineWidth: lineWidth
          }
        }));
      draw(prevX, prevY, currX, currY, colour, lineWidth);
    }
    prevX = currX;
    prevY = currY;
  }
});
canvas.addEventListener("click", function (e) {
  if (myPlayerId === drawingPlayerId) {
    currX = e.offsetX;
    currY = e.offsetY;
    prevX = currX;
    prevY = currY - 1;
    websocket.send(
      JSON.stringify({
        'type': 'coordinates',
        'data': {
          prevX: prevX,
          prevY: prevY,
          currX: currX,
          currY: currY,
          colour: colour,
          lineWidth: lineWidth
        }
      }));
    draw(prevX, prevY, currX, currY, colour, lineWidth);
  }
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

function draw(prevX, prevY, currX, currY, colour, lineWidth) {
  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');
  ctx.beginPath();
  ctx.moveTo(prevX, prevY);
  ctx.lineTo(currX, currY);
  ctx.strokeStyle = colour;
  ctx.lineCap = 'round';
  ctx.lineWidth = lineWidth;
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
      draw(coords.prevX, coords.prevY, coords.currX, coords.currY, coords.colour, coords.lineWidth);
      break;
    case 'my-player-id':
      myPlayerId = message.data;
      break;
    case 'drawing-player':
      drawingPlayerId = message.data.id;
      toggleChat();
      printBotMessage(message.data.name, 'is drawing', 'lightblue')
      break;
    case 'players':
      updatePlayersList(message.data)
      break;
    case 'chat':
      printChatMessage(message.data.name, message.data.message)
      break;
    case 'clear-canvas':
      clearCanvas()
      break;
    case 'secret-word':
      updateSecretWord(message.data)
      break;
    case 'player-correct-guess':
      printBotMessage(message.data.id, 'has guessed the word', 'limegreen')
      break;
    case 'player-connected':
      printBotMessage(message.data, 'has connected', 'lightblue')
      break;
    case 'player-disconnected':
      printBotMessage(message.data, 'has disconnected', 'lightblue')
      break;
    case 'clock':
      updateClock(message.data);
      break;
    case 'show-round-info':
      showRoundInfo(message.data);
      break;
    case 'hide-round-info':
      clearCanvas();
      hideRoundInfo();
      break;
    default:
      console.log(message);
  }

}

function showRoundInfo(data) {
  console.log(data);
  if (data["previous-secret-word"] && data["previous-player-drawing"]) {
    roundInfoPreviousWord.innerHTML = data["previous-secret-word"];
    roundInfoPreviousPlayerDrawing.innerHTML = data["previous-player-drawing"];
    previousRoundContainer.style.display = 'block'
  } else {
    previousRoundContainer.style.display = 'none'
  }
  roundInfoNextPlayerDrawing.innerHTML = data['next-player-drawing'];
  canvasOverlay.style.display = "block";
  updateClock('');
}

function hideRoundInfo() {
  canvasOverlay.style.display = "none";
}

function updatePlayersList(list) {
  var playersColumn = document.getElementById('playerslist');
  while (playersColumn.firstChild) {
    playersColumn.removeChild(playersColumn.firstChild);
  }

  list.forEach(function (elm) {
    var div = document.createElement('div');
    var idText = document.createTextNode(elm.name);
    var idSpan = document.createElement('span');
    idSpan.appendChild(idText);
    if (myPlayerId === elm.id) {
      idSpan.classList.add('my-player-id');
    }
    if (elm.isDrawing) {
      idSpan.classList.add('drawing-player-id');
    }
    var scoreText = document.createTextNode(elm.score);
    var scoreSpan = document.createElement('span');
    scoreSpan.classList.add('player-score');
    scoreSpan.appendChild(scoreText);
    div.appendChild(idSpan);
    div.appendChild(scoreSpan);
    playersColumn.appendChild(div);
  });
}

function updateSecretWord(secretWord) {
  document.getElementById('secret-word').innerHTML = secretWord;
}

function getWebSocketUrl() {
  return location.origin.replace("https", "wss").replace("http", "ws");
}

function printChatMessage(name, message) {
  var paragraphNode = document.createElement('p');
  var messageTextNode = document.createTextNode(name + ': ' + message);
  paragraphNode.appendChild(messageTextNode);
  chatboxOutput.appendChild(paragraphNode);
  chatboxOutput.scrollTop = chatboxOutput.scrollHeight;
  if (chatboxOutput.childElementCount > 20) {
    chatboxOutput.firstChild.remove();
  }
}

function printBotMessage(id, message, color) {
  var paragraphNode = document.createElement('p');
  var messageTextNode = document.createTextNode(id + ' ' + message);
  paragraphNode.appendChild(messageTextNode);
  paragraphNode.setAttribute('style', 'color: ' + color);
  chatboxOutput.appendChild(paragraphNode);
  chatboxOutput.scrollTop = chatboxOutput.scrollHeight;
  if (chatboxOutput.childElementCount > 20) {
    chatboxOutput.firstChild.remove();
  }
}

function updateClock(clock) {
  clockElement.innerHTML = clock;
}

function toggleChat() {
  if (myPlayerId === drawingPlayerId) {
    chatInput.value = 'Chat disabled';
    chatInput.disabled = true;
  } else {
    chatInput.value = chatInput.value.replace(/^Chat disabled$/, '');
    chatInput.disabled = false;
  }
}

function changeCursor() {
  radius = Math.max(lineWidth / 2, 3);
  length = radius * 2;
  svg.setAttribute('width', length);
  svg.setAttribute('height', length);
  circle.setAttribute('fill', colour);
  circle.setAttribute('cx', radius);
  circle.setAttribute('cy', radius);
  circle.setAttribute('r', radius);
  var s = new XMLSerializer().serializeToString(svg);
  var encodedData = window.btoa(s);
  canvas.style.cssText = 'cursor: url(data:image/svg+xml;base64,' + encodedData + ') ' + radius + ' ' + radius + ', auto;';
}

function getCookie(c_name) {
  if (document.cookie.length > 0) {
    c_start = document.cookie.indexOf(c_name + "=");
    if (c_start != -1) {
      c_start = c_start + c_name.length + 1;
      c_end = document.cookie.indexOf(";", c_start);
      if (c_end == -1) {
        c_end = document.cookie.length;
      }
      return unescape(document.cookie.substring(c_start, c_end));
    }
  }
  return "";
}