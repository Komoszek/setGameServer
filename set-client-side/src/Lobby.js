import React, { Component } from 'react';
import logo from './logo.svg';
import openSocket from 'socket.io-client';
import Cookies from 'universal-cookie';

const userCookies = new Cookies();


const socket = openSocket(':3001/lobby');

  socket.on('error', function(err) {
    console.log("a");
console.log('The server sent an error', err);
});

/*



  newRoom = function(mode,timeout) {
    var roomObj = {"name":"dupa chuj"};
    switch(mode){
      case "sup":
      roomObj.mode = "sup";
      break;
      default:
      ;
    }

    roomObj.timeout = timeout;


    socket.emit('create-room', roomObj);
  }






  socket.on('redirect-room', function(hash) {
    console.log(hash);
    window.location.replace("room/" + hash);

  });
*/
function ListItem(props){
  return(<a href={'/room/' + props.name}><li><div ><div>{props.name}</div></div></li></a>);

}

class GameList extends Component{
  constructor(props){
    super(props);
    this.state = {
      rooms: [],

    }
  }

  componentDidMount(){
    console.log("suk");
    socket.on('session', (data) => this._handleCookies(data));
    socket.on('news',  (data) => this._handleRooms(data));

  }

  _handleCookies(data){
      userCookies.set('sessionid',data.sessionid,{path:'/'})
      userCookies.set('userId',data.userId,{path:'/'})
  }

  _handleRooms(data){
    this.setState({rooms:data});
    console.log(data);
  }
  renderItem(room){
    return(<ListItem key={room} name={room}/>);
  }


  render(){
    var room = this.state.rooms;

    var Items = [];

    for(var i = 0; i <room.length ;i++)
      Items.push(this.renderItem(room[i]));
    return (<div><ul>{Items}</ul></div>);
  }

}

export default GameList;
