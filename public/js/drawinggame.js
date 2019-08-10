var websocket = new WebSocket(getWebSocketUrl(), "protocolOne");
var mousedown = false;
var myPlayerName;
var drawingPlayerName;
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

lineWidthInput.addEventListener('change', function (e) {
  lineWidth = lineWidthInput.value;
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
  if (myPlayerName === drawingPlayerName) {
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
  if (myPlayerName === drawingPlayerName) {
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
    case 'my-player-name':
      myPlayerName = message.data;
      break;
    case 'drawing-player-name':
      drawingPlayerName = message.data;
      toggleChat();
      printBotMessage(message.data, 'is drawing', 'lightblue')
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
      printBotMessage(message.data.name, 'has guessed the word', 'limegreen')
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
    var nameText = document.createTextNode(elm.name);
    var nameSpan = document.createElement('span');
    nameSpan.appendChild(nameText);
    if (myPlayerName === elm.name) {
      nameSpan.classList.add('my-player-name');
    }
    if (elm.isDrawing) {
      nameSpan.classList.add('drawing-player-name');
    }
    var scoreText = document.createTextNode(elm.score);
    var scoreSpan = document.createElement('span');
    scoreSpan.classList.add('player-score');
    scoreSpan.appendChild(scoreText);
    div.appendChild(nameSpan);
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

function printBotMessage(name, message, color) {
  var paragraphNode = document.createElement('p');
  var messageTextNode = document.createTextNode(name + ' ' + message);
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
  if (myPlayerName === drawingPlayerName) {
    chatInput.value = 'Chat disabled';
    chatInput.disabled = true;
  } else {
    chatInput.value = chatInput.value.replace(/^Chat disabled$/, '');
    chatInput.disabled = false;
  }
}
