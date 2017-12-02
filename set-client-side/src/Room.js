import React, { Component } from 'react';
import logo from './logo.svg';
import './room.css';
import openSocket from 'socket.io-client';
import Cookies from 'universal-cookie';

const userCookies = new Cookies();


var hash = document.location.pathname;
hash = hash.split('/');

const socket = openSocket(':3001/room', {
  query: 'room=' + hash[2]
});

socket.on('game-end', function() {
  alert('koniec');
});

var mod = function(n, m) {
  return ((n % m) + m) % m;
}

var arrayWithoutElementAtIndex = function(arr, index) {
  return arr.filter(function(value, arrIndex) {
    return index !== arrIndex;
  });
}

var cardToImg = function(a) {
  if(!(typeof a === "object" && a.length === 4))
    return ' ';
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
  return '../icons/' + k;
}

function Card(props){
  var srcId = cardToImg(props.cardId);

  return (
    <div className="card" data-selected={props.selected} data-taken={props.taken}  onClick={props.onClick}>
    <img src={srcId}/>
    </div>
  );
}

class Board extends Component{
  constructor(props){
    super(props);
    this.state = {
      cards: [],
      selectedCards: [],
      mode: 'std',
      remainingCards: null,
      size: null,
      setLength: 3,
      takenSet: [],
      changed: [],
    }
  }

  checkSet(cards,selectedCards) {

      if (this.state.mode === 'std') {

      var score = 0;
      for (var i = 0; i < 4; i++) {
        score = 0;
        for (var j = 0; j < 3; j++) {
          score +=cards[selectedCards[j]][i];
        }
        if (score % 3) return false;
      }
      return true;
    } else if (this.state.mode === 'sup') {
      var wantedCard = [];
      var wantedCard2 = [];
      var smallerSet = [];
      for (var i = 1; i < selectedCards.length; i++) {

        wantedCard[0] = mod((-cards[selectedCards[0]][0] - cards[selectedCards[i]][0]), 3);
        wantedCard[1] = mod((-cards[selectedCards[0]][1] - cards[selectedCards[i]][1]), 3);
        wantedCard[2] = mod((-cards[selectedCards[0]][2] - cards[selectedCards[i]][2]), 3);
        wantedCard[3] = mod((-cards[selectedCards[0]][3] - cards[selectedCards[i]][3]), 3);

        smallerSet = (arrayWithoutElementAtIndex(selectedCards, i)).slice(1, selectedCards.length);

        wantedCard2[0] = mod((-cards[smallerSet[0]][0] - cards[smallerSet[1]][0]), 3);
        wantedCard2[1] = mod((-cards[smallerSet[0]][1] - cards[smallerSet[1]][1]), 3);
        wantedCard2[2] = mod((-cards[smallerSet[0]][2] - cards[smallerSet[1]][2]), 3);
        wantedCard2[3] = mod((-cards[smallerSet[0]][3] - cards[smallerSet[1]][3]), 3);

        if (wantedCard2[0] === wantedCard[0] &&
          wantedCard2[1] === wantedCard[1] &&
          wantedCard2[2] === wantedCard[2] &&
          wantedCard2[3] === wantedCard[3]) {
          for (var a = 0; a < cards.length; a++) {
            if (a === selectedCards[0] ||
              a === selectedCards[1] ||
              a === selectedCards[2] ||
              a === selectedCards[3]) continue;
            if (cards[a][0] === wantedCard[0] &&
              cards[a][1] === wantedCard[1] &&
              cards[a][2] === wantedCard[2] &&
              cards[a][3] === wantedCard[3]) return false;
          }
          return true;
        }

      }
      return false;
    }
  }

    cardClick(i) {

      var cards = this.state.cards.slice();
      var selectedCards = this.state.selectedCards.slice();
      var changed = this.state.changed.slice();

      if(this.state.selectedCards.indexOf(i) === -1){
        changed[i][0] = 'true';
        selectedCards.push(i);
      } else {
        changed[i][0] = 'false';
        selectedCards.splice(selectedCards.indexOf(i), 1);
      }
      if (selectedCards.length === this.state.setLength) {
        if (this.checkSet(cards,selectedCards)) {
          console.log(true);
          socket.emit('check-set', selectedCards.sort(function(a, b) {
            return a - b
          }));
        }

        for (var j = 0; j < selectedCards.length; j++)
          changed[selectedCards[j]][0] = 'false';

        selectedCards = [];
        console.log(changed,"BENISZ");
      }

      this.setState({cards: cards,selectedCards:selectedCards,changed:changed});
    }


  renderCard(i,k,l){
    return <Card key={i} selected={k} taken={l} cardId={this.state.cards[i]} onClick={() => this.cardClick(i)}/>
  };

componentDidMount(){
  socket.on('board-setup', (data) => this._setupBoard(data));
  socket.on('taken-set', (takenset) => this._handleTakenset(takenset));
  socket.on('game-change', (newBoard) => this._gameChenge(newBoard));
};

_setupBoard(newBoard){
  var setLength = 3;
  var mode = newBoard.splice(-1)[0];
  var remainingCards = newBoard.splice(-1)[0];
  var size = newBoard.length;
  var cards = newBoard;

  var changed = [];
  for(var i = 0;i<cards.length;i++){
    changed.push(['false','false']);
  }

  switch (mode) {
    case 'sup':
      setLength = 4;
      break;
    default:
      ;
  }
  this.setState({cards:cards,size:size,remainingCards:remainingCards,setLength:setLength,mode:mode,changed:changed});
};

_handleTakenset(takenset){
  var changed = this.state.changed.slice()
  for(var i = 0;i<takenset.length;i++){
    changed[takenset[i]][1] = 'true';
  }

    this.setState({takenSet:takenset,changed:changed});
}

_gameChenge(newBoard){
  var remainingCards = this.state.remainingCards;
  var cards = this.state.cards.slice();
  var changed = this.state.changed.slice();
  var selectedCards = this.state.selectedCards.slice();

  for (var card in newBoard) {
    if (typeof(newBoard[card]) === 'object') {
      remainingCards--;
      if(card >= cards.length){
        var s = card-cards.length;
        for(var z = 0;z<=s;z++){
          cards.push([]);
          changed.push(['false','false']);
        }

      }
      cards[card] = newBoard[card];

      changed[card][1] = 'false';

      if (changed[card][0] === 'true') {
        changed[card][0] = 'false';
        selectedCards.splice(selectedCards.indexOf(card), 1);
      }
    } else {
      if (newBoard[card] !== -1) {
        cards[card] = cards[newBoard[card]];
        changed[card][1] = changed[newBoard[card]][1];
        if (changed[newBoard[card]][0] === 'true') {
          changed[card][0] = changed[newBoard[card]][0];
          selectedCards[newBoard[card]] = card;
        }
      } else {
        if(card < cards.length){
          var s = card-cards.length;
          cards.splice(s);
          changed.splice(s);
        }
        if (selectedCards.indexOf(card) !== -1) {
          selectedCards.splice(selectedCards.indexOf(card), 1);
        }


      }
    }
  }
  this.setState({remainingCards:remainingCards,cards:cards,changed:changed,selectedCards:selectedCards});
}

  render(){

    var cards = [];

    for(var i = 0;i<this.state.cards.length;i++){
      cards.push(this.renderCard(i,this.state.changed[i][0],this.state.changed[i][1]))
    }

    return (
        <div id="boardContainer">
          {cards}
        </div>
    );
  }
}

function ScoreboardItem(props){
  return(
    <li><div><div data-you={props.you}>{props.username}</div><div className="score">{props.score}</div></div></li>
  );
}

class Scoreboard extends Component{
  constructor(props){
    super(props);
    this.state = {
      players:{},
      you: userCookies.get('userId'),
    };
  }

  renderItem(i){
    var player = this.state.players[i];
    console.log(this.state.you);
    if(this.state.you === i)
    return(<ScoreboardItem key={i} username={player.username}  you="true" score={player.score}/>);
    else
    return(<ScoreboardItem key={i} username={player.username}  you="" score={player.score}/>);
  };b

  componentDidMount(){
    socket.on('change-score', (data) => this._handleScoreboardChange(data));
    socket.on('scoreboard-setup', (data) => this._handleScoreboardSetup(data));
    socket.on('session', (data) => this._handleCookies(data));
  }

  _handleScoreboardChange(data){
    var players = this.state.players;
    players[data.userId].score = data.score;
    console.log(players,"chujchujchuj");
    this.setState({players: players});
  }

  _handleScoreboardSetup(data){
    var players = data;
    console.log(data,"penispenis")
    for(var key in players){
      players[key].username = key;
    }
    this.setState({players:players})
  }

  _handleCookies(data){
      userCookies.set('sessionid',data.sessionid,{path:'/'})
      userCookies.set('userId',data.userId,{path:'/'})

      this._changeYou(data.userId);
  }

  _changeYou(userId){
    this.setState({you:userId});
  }

  render(){
    var Items = [];
    var topScoreboard = [];
    var players = this.state.players;
    for(var key in players){
      topScoreboard.push(key);
    }

    topScoreboard.sort((a,b) => {return players[a].score < players[b].score});
    console.log(topScoreboard,players);
    var k = 5 > topScoreboard.length ? topScoreboard.length : 5;
    for(var i=0;i<k;i++){
      console.log("dupa");
      Items.push(this.renderItem(topScoreboard[i]));
    }

    console.log(Items);
    return(
      <div className="scoreboardContainer">
      <ul>
      {Items}
      </ul>
      </div>
    );
  }
}


class Room extends Component {
  constructor(props){
    super(props);
    this.state = {

    }
  }

  render() {
    return (<div>
      <Scoreboard />
        <Board />
        </div>
    );
  }
}
export default Room;
