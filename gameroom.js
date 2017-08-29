var io = undefined;
const allowedModes = ["std", "sup"];

mod = (n, m) => {
  return ((n % m) + m) % m;
}

const arrayWithoutElementAtIndex = function(arr, index) {
  return arr.filter(function(value, arrIndex) {
    return index !== arrIndex;
  });
}

shuffle = (a) => {
  var j, x, i;
  for (i = a.length; i; i--) {
    j = Math.floor(Math.random() * i);
    x = a[i - 1];
    a[i - 1] = a[j];
    a[j] = x;
  }
}

var gameRoom = function(roomOptions) {
  if (roomOptions === undefined) roomOptions = {};

  this.remainingCards = [];

  for (var i = 0; i < 3; i++)
    for (var j = 0; j < 3; j++)
      for (var k = 0; k < 3; k++)
        for (var l = 0; l < 3; l++)
          this.remainingCards.push([i, j, k, l]);

  this.started = false;
  this.roomName = roomOptions.hasOwnProperty("name") ? roomOptions.name : roomOptions.hash;
  this.mode = roomOptions.hasOwnProperty("mode") && allowedModes.indexOf(roomOptions.mode) !== -1 ? roomOptions.mode : "std";
  this.cardTimeout = roomOptions.hasOwnProperty("timeout") ? roomOptions.timeout : 0;
  this.crossed = [];
  this.hash = roomOptions.hash;

  shuffle(this.remainingCards);
}

setIO = function(newIO) {
  io = newIO;
}

gameRoom.prototype.verifySet = function(set) {

  var allowedLength = this.mode !== "sup" ? 3 : 4;
  if (set.length !== allowedLength) return false;


  for (var i = 1; i < allowedLength; i++) {
    if (typeof set[i] !== "number" || set[i] === set[0])
      return;
  }

  if (this.mode === "std") {
    var score = 0;
    for (var i = 0; i < 4; i++) {
      score = 0;
      for (var j = 0; j < allowedLength; j++) {
        if (!(this.onBoard.hasOwnProperty(set[j]))) return false;
        score += this.onBoard[set[j]][i];
      }
      if (score % 3) return false;
    }
    return true;
  } else if (this.mode === "sup") {
    var wantedCard = [];
    var wantedCard2 = [];
    var smallerSet = [];
    console.log(set);
    for (var i = 1; i < allowedLength; i++) {

      wantedCard[0] = mod((-this.onBoard[set[0]][0] - this.onBoard[set[i]][0]), 3);
      wantedCard[1] = mod((-this.onBoard[set[0]][1] - this.onBoard[set[i]][1]), 3);
      wantedCard[2] = mod((-this.onBoard[set[0]][2] - this.onBoard[set[i]][2]), 3);
      wantedCard[3] = mod((-this.onBoard[set[0]][3] - this.onBoard[set[i]][3]), 3);

      smallerSet = (arrayWithoutElementAtIndex(set, i)).slice(1, set.length);

      wantedCard2[0] = mod((-this.onBoard[smallerSet[0]][0] - this.onBoard[smallerSet[1]][0]), 3);
      wantedCard2[1] = mod((-this.onBoard[smallerSet[0]][1] - this.onBoard[smallerSet[1]][1]), 3);
      wantedCard2[2] = mod((-this.onBoard[smallerSet[0]][2] - this.onBoard[smallerSet[1]][2]), 3);
      wantedCard2[3] = mod((-this.onBoard[smallerSet[0]][3] - this.onBoard[smallerSet[1]][3]), 3);

      if (wantedCard2[0] === wantedCard[0] &&
        wantedCard2[1] === wantedCard[1] &&
        wantedCard2[2] === wantedCard[2] &&
        wantedCard2[3] === wantedCard[3]) {
        for (var a = 0; a < this.onBoard.length; a++) {
          if (a === set[0] ||
            a === set[1] ||
            a === set[2] ||
            a === set[3]) continue;
            if (this.onBoard[a][0] === wantedCard[0] &&
              this.onBoard[a][1] === wantedCard[1] &&
              this.onBoard[a][2] === wantedCard[2] &&
              this.onBoard[a][3] === wantedCard[3]) return false;


        }
        return true;
      }

    }
    return false;


  }

}

gameRoom.prototype.startGame = function() {
  if (this.started !== true) {

    this.onBoard = this.remainingCards.splice(-12);

    while (!(this.setAvailable()))
      this.onBoard = this.onBoard.concat(this.remainingCards.splice(-3));

    this.started = true;
  }
  console.log(this.onBoard);
  io.in(this.hash).emit('board-setup', this.onBoard.concat(this.remainingCards.length, this.mode));
}

gameRoom.prototype.setAvailable = function() {
  var wantedCard = [];

  //I chose performence over beauty
  if (this.mode === "std") {

    var temp2 = JSON.parse(JSON.stringify(this.onBoard));
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
          for (var l = 0; l < temp2.length; l++) {
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
  } else if (this.mode === "sup") {
    var temp = this.onBoard;

    var cardFound = false;
    var wantedCardsObj = {}

    for (var i = 0; i < temp.length; i++) {
      for (var j = i + 1; j < temp.length; j++) {
        wantedCard[0] = mod((-temp[i][0] - temp[j][0]), 3);
        wantedCard[1] = mod((-temp[i][1] - temp[j][1]), 3);
        wantedCard[2] = mod((-temp[i][2] - temp[j][2]), 3);
        wantedCard[3] = mod((-temp[i][3] - temp[j][3]), 3);
        for (var k = 0; k < temp.length; k++) {
          if (k === j || k === i) continue;
          if (temp[k][0] === wantedCard[0] &&
            temp[k][1] === wantedCard[1] &&
            temp[k][2] === wantedCard[2] &&
            temp[k][3] === wantedCard[3]) {
            cardFound = true;
            break;
          }
        }
        if (cardFound) {
          cardFound = false;
          continue;
        }

        var index = "" + wantedCard[0] + wantedCard[1] + wantedCard[2] + wantedCard[3];
        if (wantedCardsObj.hasOwnProperty(index)) {
          return true;
        } else wantedCardsObj[index] = 0;
        cardFound = false;

      }
    }

    return false;

  }
}
gameRoom.prototype.gameStep = function(set) {
  console.log("set", set);
  console.log("len", this.onBoard.length);
  console.log("rem", this.remainingCards.length);
  var newSetObj = {};
  if (this.remainingCards.length && parseInt(this.onBoard.length - set.length) < 12) {
    var toRemove = -(12 - this.onBoard.length);

    var newSet = this.remainingCards.splice(-(set.length - toRemove));
    if (newSet.length !== (set.length - toRemove)) toRemove = set.length - newSet.length;
    console.log(newSet.length);
    for (var i = 0; i < newSet.length; i++) {
      this.onBoard[set[i]] = newSet[i];
      newSetObj[set[i]] = newSet[i];
    }
    set.splice(0, i);
  } else {
    var toRemove = set.length;
  }

  console.log(set);
  console.log(toRemove);


  if (toRemove !== 0) {

    var indexOfRemoved = [];
    for (var i = this.onBoard.length - toRemove; i < this.onBoard.length; i++) {
      indexOfRemoved.push(i);
      console.log("chuj");
    }

    var removedFromBoard = this.onBoard.splice(-toRemove);
    for (var i = 0; i < toRemove; i++) {
      newSetObj[this.onBoard.length + i] = -1;
      if (set[i] >= this.onBoard.length) {
        removedFromBoard[set[i] - this.onBoard.length] = -1;
        indexOfRemoved[set[i] - this.onBoard.length] = -1;
      }
    }

    while (removedFromBoard.indexOf(-1) !== -1) {
      indexOfRemoved.splice(removedFromBoard.indexOf(-1), 1);
      removedFromBoard.splice(removedFromBoard.indexOf(-1), 1);
    }

    for (var i = 0; i < removedFromBoard.length; i++) {
      newSetObj[set[i]] = indexOfRemoved[i];
      this.onBoard[set[i]] = removedFromBoard[i];

      if (this.cardTimeout !== 0) {
        for (var a = 0; a < this.crossed.length; a++)
          for (var b = 0; b < this.crossed[a].length; b++) {
            if (this.crossed[a][b] === indexOfRemoved[i]) this.crossed[a][b] = set[i];
          }
      }
    }
  }


  while (!(this.setAvailable())) {
    var newestSet = this.remainingCards.splice(-3);
    if (!newestSet.length) {

      //TODO wysyłanie razem z nowymi setami
      io.in(this.hash).emit('game-end', '');
      break
    };

    for (var i = 0; i < newestSet.length; i++) {
      newSetObj[this.onBoard.length] = newestSet[i];
      this.onBoard.push(newestSet[i]);
    }
  }

  return newSetObj;
}

gameRoom.prototype.checkSet = function(selectedSet) {


  if (!this.verifySet(selectedSet))
    return;

  if (this.cardTimeout !== 0) {
    console.log("no kurwa");
    var g = 0;
    for (var i = 0; i < selectedSet.length; i++) {
      if (this.onBoard[selectedSet[i]][4] !== undefined) g++;
      if (g > 1) return;
    }

    io.in(this.hash).emit('taken-set', selectedSet);

    var fixedSelectedSet = JSON.parse(JSON.stringify(selectedSet));
    for (var i = 0; i < selectedSet.length; i++) {
      if (this.onBoard[selectedSet[i]][4] === undefined) {
        this.onBoard[selectedSet[i]][4] = 1;
      } else {
        fixedSelectedSet.splice(fixedSelectedSet.indexOf(selectedSet[i]), 1);
      }
    }

    this.crossed.push(fixedSelectedSet);
    fixedSelectedSet = this.crossed[this.crossed.length - 1];
  }

  setTimeout(() => {

    if (this.cardTimeout === 0) {
      gameChange = this.gameStep(selectedSet);

    } else {
      gameChange = this.gameStep(fixedSelectedSet);

      this.crossed.shift();

    }
    saveDatabase();

    io.in(this.hash).emit('game-change', gameChange);

  }, this.cardTimeout);
}


module.exports = gameRoom;
