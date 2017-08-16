var express = require("express");
var app = express();
var path = require("path");
var http = require("http").Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var shortid = require('shortid');


var db = '';

fs.readFile('db.json', "UTF8", function(err, data) {
  if (err) {
    throw err
  };
  db = JSON.parse(data);
});

saveDatabase = function(){
  fs.writeFile("db.json", JSON.stringify(db), (err) => {
    if (err) throw err;
    console.log("saved");
  });
}

String.prototype.hashCode = function() {
  var hash = 0, i, chr;
  if (this.length === 0) return hash;
  for (i = 0; i < this.length; i++) {
    chr   = this.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

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
  var cardsOnBoard = db.rooms[room].onBoard;
  for (var i = 0; i < 3; i++) {
    score = 0;
    for (var j = 0; j < 3; j++) {
      score += cardsOnBoard[set[j]][i];
    }
    if (score % 3) return false;
  }
  return true;
}

setAvailable = function(room){
  var temp = JSON.parse(JSON.stringify(db.rooms[room].onBoard))
  temp2 = temp.splice(0,temp.length/2);  temp2 = temp.splice(0,temp.length/2);

}



gameStep = function(room, set){

  var newSetObj = {};
  console.log(-(12 - (db.rooms[room].onBoard.length - set.legth)));

  if( parseInt(db.rooms[room].onBoard.length - set.length) < 12){
    var newSet = db.rooms[room].remainingCards.splice(-(12 - (db.rooms[room].onBoard.length - set.length)));

    for(var i=0;i<newSet.length;i++){
      db.rooms[room].onBoard[set[i]] = newSet[i];
      newSetObj[set[i]] = newSet[i];
    }

    for(var i=newSet.length;i<set.length;i++){
      db.rooms[room].onBoard[set[i]] = db.rooms[room].onBoard.splice(-1);
      newSetObj[db.rooms[room].onBoard.length] = -1;
    }
  } else {
    for(var i=0;i<set.length;i++){
      db.rooms[room].onBoard[set[i]] = db.rooms[room].onBoard.splice(-1);
      newSetObj[db.rooms[room].onBoard.length] = -1;
    }
  }

setAvailable(room);

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

  if((db.rooms).hasOwnProperty(req.params.hash))
  res.sendFile(path.join(__dirname, '/public/room.html'));
  else
  res.sendFile(path.join(__dirname, '/public/404.html'));

  //It will find and locate index.html from View or Scripts
});





io.sockets.on('connection', function(socket) {

  socket.on('room', function(room) {
    socket.join(room);

    if(db.rooms[room].started == true){
      io.in(room).emit('board-setup', db.rooms[room].onBoard);
    }
  });

  socket.on('create-room',function(){
    var setArray = [];

    for(var i=0;i<3;i++)
      for(var j=0;j<3;j++)
        for(var k=0;k<3;k++)
          for(var l=0;l<3;l++){
            setArray.push([i,j,k,l]);
          }
    shuffle(setArray);
var hash = shortid.generate();

  db.rooms[hash] = {};
  db.rooms[hash].remainingCards = setArray;
  db.rooms[hash].started = false;
  saveDatabase();

  });
  socket.on('start-game',function(){
    var gameRoom = Object.keys(socket.rooms).filter(item => item != socket.id)[0];

    if( db.rooms[gameRoom].started != true){

      db.rooms[gameRoom].onBoard = db.rooms[gameRoom].remainingCards.splice(0,12);

      db.rooms[gameRoom].started = true;

      saveDatabase();
    }

    io.in(gameRoom).emit('board-setup', db.rooms[gameRoom].onBoard);
  });


  socket.on('dupa',function(msg){
    var gameRoom = Object.keys(socket.rooms).filter(item => item != socket.id)[0];

    io.in(gameRoom).emit('news', msg);
  });


  socket.on('check-set', function(selectedSet) {

    var gameRoom = Object.keys(socket.rooms).filter(item => item != socket.id)[0];
    //console.log(db.rooms[gameRoom].remainingCards.length);
    if (!checkSet(gameRoom, selectedSet)){
        return;
    }

    gameChange = gameStep(gameRoom, selectedSet);
    io.in(gameRoom).emit('game-change', gameChange);

  });

});


http.listen(3000, function() {
  console.log('listening on *:3000');
});
