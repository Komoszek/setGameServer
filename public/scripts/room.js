setLength = 3;

mod = function(n, m) {
  return ((n % m) + m) % m;
}


arrayWithoutElementAtIndex = function(arr, index) {
  return arr.filter(function(value, arrIndex) {
    return index !== arrIndex;
  });
}

var selectedCards = [];
var board = {
  'cards': {}
};
var hash = document.location.pathname;
hash = hash.split('/');

cardToImg = function(a) {
  var k;

  k = (a[0] + 1);
  switch (a[1]) {
    case 0:
      k += 'O';
      break;
    case 1:
      k += 'S';
      break;
    case 2:
      k += 'H';
      break;
    default:
      ;
  }

  switch (a[2]) {
    case 0:
      k += 'g';
      break;
    case 1:
      k += 'p';
      break;
    case 2:
      k += 'r';
      break;
    default:
      ;
  }

  switch (a[3]) {
    case 0:
      k += 'S.svg';
      break;
    case 1:
      k += 'P.svg';
      break;
    case 2:
      k += 'D.svg';
      break;
    default:
      ;
  }
  return k;
}

var socket = io('/room', {
  query: 'room=' + hash[2]
});


socket.on('session', function(sessionid) {
  console.log(sessionid);
  document.cookie = 'sessionid=' + sessionid + '; path=/';
});

socket.on('game-end', function() {
  alert('koniec');
});

socket.on('game-change', function(newBoard) {
  for (var card in newBoard) {
    if (typeof(newBoard[card]) === 'object') {
      board.remainingCards--;
      board.cards[card] = newBoard[card];
      document.getElementsByClassName('card')[card].getElementsByTagName('img')[0].src = '../icons/' + cardToImg(board.cards[card]);
      document.getElementsByClassName('card')[card].setAttribute('taken', '');

      if (document.getElementsByClassName('card')[card].getAttribute('selected') === 'true') {
        document.getElementsByClassName('card')[card].setAttribute('selected', '');
        selectedCards.splice(selectedCards.indexOf(card), 1);
      }
    } else {
      if (newBoard[card] !== -1) {
        board.cards[card] = board.cards[newBoard[card]];
        document.getElementsByClassName('card')[card].getElementsByTagName('img')[0].src = document.getElementsByClassName('card')[newBoard[card]].getElementsByTagName('img')[0].src;
        document.getElementsByClassName('card')[newBoard[card]].getElementsByTagName('img')[0].src = '';
        document.getElementsByClassName('card')[card].setAttribute('taken', document.getElementsByClassName('card')[newBoard[card]].getAttribute('taken'));
        if (document.getElementsByClassName('card')[newBoard[card]].getAttribute('selected') === 'true') {
          document.getElementsByClassName('card')[card].setAttribute('selected', document.getElementsByClassName('card')[newBoard[card]].getAttribute('selected'));
          selectedCards[newBoard[card]] = card;
        }
      } else {
        board.cards[card] = -1;

        document.getElementsByClassName('card')[card].getElementsByTagName('img')[0].src = '';
        document.getElementsByClassName('card')[card].setAttribute('taken', '');
        if (document.getElementsByClassName('card')[card].getAttribute('selected') === 'true') {
          document.getElementsByClassName('card')[card].setAttribute('selected', '');
          selectedCards.splice(selectedCards.indexOf(card), 1);
        }
      }
    }
  }
});

socket.on('taken-set', function(takenSet) {
  for (let i = 0; i < takenSet.length; i++) {
    document.getElementsByClassName('card')[takenSet[i]].setAttribute('taken', 'true');
  }
});

for (var i = 0; i < 19; i++) {
  board.cards[i] = -1;
  document.getElementById('boardContainer').innerHTML += '<div class="card" onclick="cardClick(' + i + ')" selected="" taken=""><img></div>'
}

socket.on('board-setup', function(newBoard) {
  document.getElementById('startButton').style.display = 'none';
  board.mode = newBoard.splice(-1)[0];
  board.remainingCards = newBoard.splice(-1)[0];
  board.size = newBoard.length;
  board.cards = newBoard;

  switch (board.mode) {
    case 'sup':
      setLength = 4;
      break;
    default:
      ;
  }

  for (var i = 0; i < board.size; i++) {
    document.getElementsByClassName('card')[i].getElementsByTagName('img')[0].src = '../icons/' + cardToImg(board.cards[i]);
  }

});

startGame = function() {
  socket.emit('start-game');
}

checkSet = function() {

  if (board.mode === 'std') {

    var score = 0;
    for (var i = 0; i < 4; i++) {
      score = 0;
      for (var j = 0; j < 3; j++) {
        score += board.cards[selectedCards[j]][i];
      }
      if (score % 3) return false;
    }
    return true;
  } else if (board.mode === 'sup') {
    var wantedCard = [];
    var wantedCard2 = [];
    var smallerSet = [];
    for (var i = 1; i < selectedCards.length; i++) {

      wantedCard[0] = mod((-board.cards[selectedCards[0]][0] - board.cards[selectedCards[i]][0]), 3);
      wantedCard[1] = mod((-board.cards[selectedCards[0]][1] - board.cards[selectedCards[i]][1]), 3);
      wantedCard[2] = mod((-board.cards[selectedCards[0]][2] - board.cards[selectedCards[i]][2]), 3);
      wantedCard[3] = mod((-board.cards[selectedCards[0]][3] - board.cards[selectedCards[i]][3]), 3);

      smallerSet = (arrayWithoutElementAtIndex(selectedCards, i)).slice(1, selectedCards.length);

      wantedCard2[0] = mod((-board.cards[smallerSet[0]][0] - board.cards[smallerSet[1]][0]), 3);
      wantedCard2[1] = mod((-board.cards[smallerSet[0]][1] - board.cards[smallerSet[1]][1]), 3);
      wantedCard2[2] = mod((-board.cards[smallerSet[0]][2] - board.cards[smallerSet[1]][2]), 3);
      wantedCard2[3] = mod((-board.cards[smallerSet[0]][3] - board.cards[smallerSet[1]][3]), 3);

      if (wantedCard2[0] === wantedCard[0] &&
        wantedCard2[1] === wantedCard[1] &&
        wantedCard2[2] === wantedCard[2] &&
        wantedCard2[3] === wantedCard[3]) {
        for (var a = 0; a < board.cards.length; a++) {
          if (a === selectedCards[0] ||
            a === selectedCards[1] ||
            a === selectedCards[2] ||
            a === selectedCards[3]) continue;
          if (board.cards[a][0] === wantedCard[0] &&
            board.cards[a][1] === wantedCard[1] &&
            board.cards[a][2] === wantedCard[2] &&
            board.cards[a][3] === wantedCard[3]) return false;
        }
        return true;
      }

    }
    return false;
  }
}

cardClick = function(i) {
  if (selectedCards.indexOf(i) == -1) {
    document.getElementsByClassName('card')[i].setAttribute('selected', 'true');
    selectedCards.push(i);
  } else {
    document.getElementsByClassName('card')[i].setAttribute('selected', '');
    selectedCards.splice(selectedCards.indexOf(i), 1);
  }

  if (selectedCards.length == setLength) {

    if (checkSet()) {
      console.log(true);
      socket.emit('check-set', selectedCards.sort(function(a, b) {
        return a - b
      }));
    }

    for (var j = 0; j < selectedCards.length; j++)
      document.getElementsByClassName('card')[selectedCards[j]].setAttribute('selected', '');

    selectedCards = [];
  }
}
