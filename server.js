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


var saveDatabase = () => {
  fs.writeFile('db.json', JSON.stringify(db), (err) => {
    if (err) throw err;
    console.log('saved');
  });
}

var sessionHandler = (socket) => {
  console.log(socket.handshake.headers.cookie, "hmm");
  if(socket.handshake.headers.cookie !== undefined){
    cookies = cookie.parse(socket.handshake.headers.cookie);
  }
  else
    cookies = {};
  if(cookies.sessionid === undefined || !db.sessions.hasOwnProperty(cookies.sessionid)){
    do{
      var sessionid = randomstring.generate();
      var userId = randomstring.generate();
    }while(db.sessions[sessionid] !== undefined)
    db.sessions[sessionid] = {};
    db.sessions[sessionid].userId = userId;

    socket.emit('session', {"sessionid":sessionid,"userId":userId});
    saveDatabase();
  } else {
    var sessionid = cookies.sessionid;
    if(cookies.userId === undefined || !cookies.hasOwnProperty("userId")){
      socket.emit('session', {"sessionid":sessionid,"userId":db.sessions[sessionid].userId});
    }
  }
  return sessionid;
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
    cookies = {};
    cookie.sessionid = undefined;

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
  var session = sessionHandler(socket);

  var hash = socket.handshake.query['room'];
  socket.join(hash);
  var room = null;
  clientOBJ = {
    "username": "dupa",
    "sessionId": session,
    "userId": db.sessions[session].userId
  };
  console.log(session,clientOBJ);

  if (db.rooms.hasOwnProperty(hash)) {
    room = db.rooms[hash];
    room.connectUser(clientOBJ);
    //rom.in(hash).emit('user-connected',{"name":clientOBJ.name,"session"})
    if (db.rooms[hash].started){
      console.log("send");

      rom.in(hash).emit('board-setup', db.rooms[hash].onBoard.concat(db.rooms[hash].remainingCards.length, db.rooms[hash].mode));
      var players = {};
      for(var key in db.rooms[hash].scoreboard){
        console.log(db.rooms[hash].scoreboard[key], "KLIENT",db.rooms[hash].scoreboard[key].score);
        players[db.rooms[hash].scoreboard[key].userId] = {"username":db.rooms[hash].scoreboard[key].username,
      "score":db.rooms[hash].scoreboard[key].score}
      }
      console.log(players,"dlaczego kurwa");
      rom.in(hash).emit('scoreboard-setup', players);

    }
  }

  socket.on('start-game', () => {
    if (db.rooms[hash].started !== true) {
      db.rooms[hash].startGame();
      saveDatabase();
    }
  });

  socket.on('check-set', selectedSet => {
    if (db.rooms[hash].checkSet(selectedSet, clientOBJ.sessionId)) {
      setTimeout(function() {
        saveDatabase()
      }, db.rooms[hash].cardTimeout + 100);
    }
  });

  socket.on('disconnect', () => {
    //var disconnectCookie = cookie.parse(socket.handshake.headers.cookie);
    if (room !== null)
      room.disconnectUser(clientOBJ);
  });

});

http.listen(3001, () => {
  console.log('listening on *:3001');
});
