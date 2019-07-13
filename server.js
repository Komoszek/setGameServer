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

    cookies = {};
    cookie.sessionid = undefined;

lobb.on('connection', socket => {
  sessionHandler(socket);

  var rooms = [];

  for(var key in db.rooms){
    rooms.push({name:db.rooms[key].roomName,
    id:key});
  }
  console.log(rooms);
  lobb.emit('news', rooms);

  socket.on('create-room', (roomOptions) => {
    roomOptions.hash = shortid.generate();

    db.rooms[roomOptions.hash] = new gameroom(roomOptions);
    saveDatabase();
    socket.emit('redirect-room', roomOptions.hash);
  });
});

rom.on('connection', socket => {
  socket.session = sessionHandler(socket);

  socket.hash = socket.handshake.query['room'];
  socket.join(socket.hash);
  socket.room = null;

  socket.clientOBJ = {
    "username": "dupa",
    "sessionId": socket.session,
    "userId": db.sessions[socket.session].userId
  };

  if (db.rooms.hasOwnProperty(socket.hash)) {
    socket.room = db.rooms[socket.hash];
    socket.room.connectUser(socket.clientOBJ);
    //rom.in(hash).emit('user-connected',{"name":clientOBJ.name,"session"})
    if (db.rooms[socket.hash].started){

      rom.in(socket.hash).emit('board-setup', db.rooms[socket.hash].onBoard.concat(db.rooms[socket.hash].remainingCards.length, db.rooms[socket.hash].mode));
      socket.players = {};
      for(var key in db.rooms[socket.hash].scoreboard){
        socket.players[db.rooms[socket.hash].scoreboard[key].userId] = {"username":db.rooms[socket.hash].scoreboard[key].username,
      "score":db.rooms[socket.hash].scoreboard[key].score}
      }
      rom.in(socket.hash).emit('scoreboard-setup', socket.players);

    }
  } else {
    rom.in(socket.hash).emit('404notfound', true);
  }

  socket.on('start-game', () => {
    if (db.rooms[socket.hash].started !== true) {
      db.rooms[socket.hash].startGame();
      saveDatabase();
    }
  });

  socket.on('check-set', selectedSet => {
    if (db.rooms[socket.hash].checkSet(selectedSet, socket.clientOBJ.sessionId)) {
      setTimeout(function() {
        saveDatabase()
      }, db.rooms[socket.hash].cardTimeout + 100);
    }
  });

  socket.on('disconnect', () => {
    //var disconnectCookie = cookie.parse(socket.handshake.headers.cookie);
    if (socket.room !== null)
      socket.room.disconnectUser(socket.clientOBJ);
  });

});

http.listen(3001, () => {
  console.log('listening on *:3001');
});
