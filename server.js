const express = require('express');
const app = express();
const path = require('path');
const http = require('http').Server(app);
const io = require('socket.io')(http);
const fs = require('fs');
const shortid = require('shortid');
const gameroom = require('./gameroom');
const randomstring = require("randomstring");
const cookie = require('cookie');

const lobb = io.of('/lobby');
const rom = io.of('/room');

var db = '';

// TODO Rysowanie zakliniętych, aktualni gracze

fs.readFile('db.json', 'UTF8', (err, data) => {
  if (err) {
    throw err
  };

  db = JSON.parse(data);

  if (!(db.hasOwnProperty('rooms'))) db.rooms = {};
  if (!(db.hasOwnProperty('accounts'))) db.accounts = {};

  setIO(rom);

  for (var hash in db.rooms) {
    var temp = JSON.parse(JSON.stringify(db.rooms[hash]));
    tempObj = {};
    tempObj.hash = hash;

    db.rooms[hash] = new gameroom(tempObj);
    for (var key in temp) {
      db.rooms[hash][key] = JSON.parse(JSON.stringify(temp[key]))
    }
  }
});
/*
lobb.use(function(socket, next){
  if (socket.request.headers.cookie) {

return next();
  }
  next('cycki', true);
});
*/

var saveDatabase = () => {
  fs.writeFile('db.json', JSON.stringify(db), (err) => {
    if (err) throw err;
    console.log('saved');
  });
}

var sessionHandler = (socket) => {
  cookies = cookie.parse(socket.handshake.headers.cookie);
  if(cookies.sessionid === undefined || !db.sessions.hasOwnProperty(cookies.sessionid)){
    do{
      var sessionid = randomstring.generate();
    }while(db.sessions[sessionid] !== undefined)
    db.sessions[sessionid] = {};

    socket.emit('session', sessionid);
    saveDatabase();
    return;
  }
  return true;
}

app.use(express.static(__dirname + '/public'));
// Store all HTML files in view folder.

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/public/index.html'));
  // It will find and locate index.html from View or Scripts
});

app.get('/room/:hash', (req, res) => {
  if ((db.rooms).hasOwnProperty(req.params.hash))
    res.sendFile(path.join(__dirname, '/public/room.html'));
  else
    res.sendFile(path.join(__dirname, '/public/404.html'));
});

lobb.on('connection', socket => {
  sessionHandler(socket);

  lobb.emit('news', Object.keys(db.rooms));

  socket.on('create-room', (roomOptions) => {
    roomOptions.hash = shortid.generate();

    db.rooms[roomOptions.hash] = new gameroom(roomOptions);
    saveDatabase();
    socket.emit('redirect-room', roomOptions.hash);
  });
});

rom.on('connection', socket => {

  sessionHandler(socket);

  var hash = socket.handshake.query['room'];
  socket.join(hash);
  var room = null;

  var cookies = cookie.parse(socket.handshake.headers.cookie);
  clientOBJ = {
    "name": "dupa",
    "io": cookies.io,
    "sessionid": cookies.sessionid
  };

  if (db.rooms.hasOwnProperty(hash)) {
    room = db.rooms[hash];
    room.connectUser(clientOBJ);
    if (db.rooms[hash].started)
      rom.in(hash).emit('board-setup', db.rooms[hash].onBoard.concat(db.rooms[hash].remainingCards.length, db.rooms[hash].mode));
  }

  socket.on('start-game', () => {
    if (db.rooms[hash].started !== true) {
      db.rooms[hash].startGame();
      saveDatabase();
    }
  });

  socket.on('check-set', selectedSet => {
    if (db.rooms[hash].checkSet(selectedSet, cookies.sessionid)) {
      setTimeout(function() {
        saveDatabase()
      }, db.rooms[hash].cardTimeout + 100);
    }
  });

  socket.on('disconnect', () => {
    var disconnectCookie = cookie.parse(socket.handshake.headers.cookie);
    if (room !== null)
      room.disconnectUser(disconnectCookie);
  });

});

http.listen(3001, () => {
  console.log('listening on *:3001');
});
