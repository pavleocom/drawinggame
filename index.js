const express = require('express')
const WebSocketServer = require("ws").Server
const http = require("http")
const path = require('path')
const PORT = process.env.PORT || 5000

var app = express()
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'))
  .listen(PORT, () => console.log(`Listening on ${PORT}`))

var server = http.createServer(app)
server.listen(5001)

console.log("http server listening on %d", 5001)

var wss = new WebSocketServer({ server: server })
console.log("websocket server created")

wss.on("connection", function (ws) {
  var id = setInterval(function () {
    ws.send(JSON.stringify(new Date()), function () { })
  }, 1000)

  console.log("websocket connection open")

  ws.on("close", function () {
    console.log("websocket connection close")
    clearInterval(id)
  })
})