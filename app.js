var express = require("express");
var app = express();
var path = require("path");
var http = require("http").Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var shortid = require('shortid');

var lobb = io.of('/lobby');
var rom = io.of('/room');

var db = '';

mod = function(n, m) {
  return ((n % m) + m) % m;
}

fs.readFile('db.json', "UTF8", function(err, data) {
  if (err) {
    throw err
  };
  db = JSON.parse(data);
});

saveDatabase = function() {
  fs.writeFile("db.json", JSON.stringify(db), (err) => {
    if (err) throw err;
    console.log("saved");
  });
}

function shuffle(a) {
  var j, x, i;
  for (i = a.length; i; i--) {
    j = Math.floor(Math.random() * i);
    x = a[i - 1];
    a[i - 1] = a[j];
    a[j] = x;
  }
}

checkSet = function(room, set) {
  var score = 0;
  for (var i = 0; i < 4; i++) {
    score = 0;
    for (var j = 0; j < 3; j++) {
      if (!(db.rooms[room].onBoard.hasOwnProperty(set[j]))) return false;
      score += db.rooms[room].onBoard[set[j]][i];
    }
    if (score % 3) return false;
  }
  return true;
}

setAvailable = function(room) {
  var wantedCard = [];
  var temp2 = JSON.parse(JSON.stringify(db.rooms[room].onBoard));
  var temp = temp2.splice(0, Math.ceil(temp2.length / 2));

  for (var i = 0; i < temp2.length + temp.length; i++) {
    if (!(parseInt(i / temp.length))) {
      for (var j = i + 1; j < temp.length; j++) {
        wantedCard[0] = mod((-temp[i][0] - temp[j][0]), 3);
        wantedCard[1] = mod((-temp[i][1] - temp[j][1]), 3);
        wantedCard[2] = mod((-temp[i][2] - temp[j][2]), 3);
        wantedCard[3] = mod((-temp[i][3] - temp[j][3]), 3);


        for (var k = j + 1; k < temp.length; k++) {
          if (temp[k][0] === wantedCard[0] &&
            temp[k][1] === wantedCard[1] &&
            temp[k][2] === wantedCard[2] &&
            temp[k][3] === wantedCard[3]) return true;
        }
        for (l = 0; l < temp2.length; l++) {
          if (temp2[l][0] === wantedCard[0] &&
            temp2[l][1] === wantedCard[1] &&
            temp2[l][2] === wantedCard[2] &&
            temp2[l][3] === wantedCard[3]) return true;
        }
      }
    } else {
      for (var j = i % temp.length + 1; j < temp2.length; j++) {
        wantedCard[0] = mod((-temp2[i % temp.length][0] - temp2[j][0]), 3);
        wantedCard[1] = mod((-temp2[i % temp.length][1] - temp2[j][1]), 3);
        wantedCard[2] = mod((-temp2[i % temp.length][2] - temp2[j][2]), 3);
        wantedCard[3] = mod((-temp2[i % temp.length][3] - temp2[j][3]), 3);
        for (var k = j + 1; k < temp2.length; k++) {
          if (temp2[k][0] === wantedCard[0] &&
            temp2[k][1] === wantedCard[1] &&
            temp2[k][2] === wantedCard[2] &&
            temp2[k][3] === wantedCard[3]) return true;
        }
        for (l = 0; l < temp.length; l++) {
          if (temp[l][0] === wantedCard[0] &&
            temp[l][1] === wantedCard[1] &&
            temp[l][2] === wantedCard[2] &&
            temp[l][3] === wantedCard[3]) return true;
        }
      }

    }
  }
  return false;
}

gameStep = function(room, set) {

  var newSetObj = {};

  if (db.rooms[room].remainingCards.length && parseInt(db.rooms[room].onBoard.length - set.length) < 12) {
    var newSet = db.rooms[room].remainingCards.splice(-(12 - (db.rooms[room].onBoard.length - set.length)));

    for (var i = 0; i < newSet.length; i++) {
      db.rooms[room].onBoard[set[i]] = newSet[i];
      newSetObj[set[i]] = newSet[i];
    }
    for (var i = newSet.length; i < set.length; i++) {
      db.rooms[room].onBoard[set[i]] = db.rooms[room].onBoard.splice(-1)[0];
      newSetObj[db.rooms[room].onBoard.length] = -1;
    }


  } else {

    var removedFromBoard = db.rooms[room].onBoard.splice(-set.length);
    g = 0;

    for (var i = 0; i < set.length; i++) {
      newSetObj[db.rooms[room].onBoard.length + i] = -1;

      if (set[i] < db.rooms[room].onBoard.length) {
        db.rooms[room].onBoard[set[g]] = removedFromBoard[i];
        newSetObj[set[g]] = removedFromBoard[i];
        g++;
      }
    }
  }

  while (!(setAvailable(room))) {
    var newestSet = db.rooms[room].remainingCards.splice(-3);
    if (!newestSet.length) {

      //TODO wysyłanie razem z nowymi setami
      rom.in(room).emit('game-end', '');
      break
    };

    for (var i = 0; i < newestSet.length; i++) {
      newSetObj[db.rooms[room].onBoard.length] = newestSet[i];
      db.rooms[room].onBoard.push(newestSet[i]);
    }
  }
  console.log(setAvailable(room));

  saveDatabase();

  return newSetObj;
}


app.use(express.static(__dirname + '/public'));
//Store all HTML files in view folder.

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, '/public/index.html'));
  //It will find and locate index.html from View or Scripts
});

app.get('/room/:hash', function(req, res) {

  if ((db.rooms).hasOwnProperty(req.params.hash))
    res.sendFile(path.join(__dirname, '/public/room.html'));
  else
    res.sendFile(path.join(__dirname, '/public/404.html'));

});




lobb.on('connection', function(socket) {

  lobb.emit('news', Object.keys(db.rooms));

  socket.on('create-room', function() {
    var setArray = [];

    for (var i = 0; i < 3; i++)
      for (var j = 0; j < 3; j++)
        for (var k = 0; k < 3; k++)
          for (var l = 0; l < 3; l++) {
            setArray.push([i, j, k, l]);
          }
    shuffle(setArray);
    var hash = shortid.generate();

    db.rooms[hash] = {};
    db.rooms[hash].remainingCards = setArray;
    db.rooms[hash].started = false;
    saveDatabase();
    socket.emit('redirect-room', hash);
  });

});


rom.on('connection', function(socket) {



  socket.on('room', function(room) {
    socket.join(room);


    if (db.rooms.hasOwnProperty(room) && db.rooms[room].hasOwnProperty("started") && db.rooms[room].started == true) {
      rom.in(room).emit('board-setup', db.rooms[room].onBoard);
    }
  });

  socket.on('start-game', function() {

    var gameRoom = Object.keys(socket.rooms).filter(item => item != socket.id)[0];

    if (db.rooms[gameRoom].started != true) {

      db.rooms[gameRoom].onBoard = db.rooms[gameRoom].remainingCards.splice(-12);

      while (!(setAvailable(gameRoom))) {
        console.log("Starting with moar cards");
        (db.rooms[gameRoom].onBoard).concat(db.rooms[gameRoom].remainingCards.splice(-3));
      }

      db.rooms[gameRoom].started = true;

      saveDatabase();
    }

    rom.in(gameRoom).emit('board-setup', db.rooms[gameRoom].onBoard);
  });


  socket.on('check-set', function(selectedSet) {

    var gameRoom = Object.keys(socket.rooms).filter(item => item != socket.id)[0];
    if (!checkSet(gameRoom, selectedSet))
      return;

    gameChange = gameStep(gameRoom, selectedSet);
    rom.in(gameRoom).emit('game-change', gameChange);

  });

});


http.listen(3000, function() {
  console.log('listening on *:3000');
});
