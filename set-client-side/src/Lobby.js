import React, { Component } from 'react';
import logo from './logo.svg';
import './lobby.css';
import openSocket from 'socket.io-client';
import Cookies from 'universal-cookie';

const userCookies = new Cookies();


const socket = openSocket(':3001/lobby');

  socket.on('error', function(err) {
console.log('The server sent an error', err);
});


function ListItem(props){
  return(<a href={'/room/' + props.id}><div className="roomContainer"><div>{props.name}</div></div></a>);

}

class GameList extends Component{
  constructor(props){
    super(props);
    this.state = {
      rooms: [],

    }
  }

  componentDidMount(){
    socket.on('session', (data) => this._handleCookies(data));
    socket.on('news',  (data) => this._handleRooms(data));

  }

  _handleCookies(data){
      userCookies.set('sessionid',data.sessionid,{path:'/'})
      userCookies.set('userId',data.userId,{path:'/'})
  }

  _handleRooms(data){

    this.setState({rooms:data});
  }
  renderItem(room){
    console.log(room);
    return(<ListItem key={room.id} id={room.id} name={room.name}/>);
  }


  render(){
    var room = this.state.rooms;

    var Items = [];

    for(var i = 0; i <room.length ;i++)
      Items.push(this.renderItem(room[i]));
    return (<div className="roomlist">{Items}</div>);
  }

}

class CreateRoom extends Component{
  constructor(props){
    super(props);
    this.state = {
      show: true,
      name: 'Room',
      mode: 'std',
      timeout: 0,
    };
    this.handleChange = this.handleChange.bind(this);
    this._createRoom = this._createRoom.bind(this);

  }


    componentDidMount(){
      console.log("dd");
     socket.on('redirect-room', (data) => this._redirect(data));
    }

    _redirect(hash){
      window.location.replace("room/" + hash);
    }

  handleChange(event) {

var target = event.target;
  var value = target.value;
  var name = target.name;

    this.setState({[name]: value});
  }

  _createRoom(event){

    var roomObj = {name:this.state.name,
                  mode:this.state.mode,
                  timeout:this.state.timeout*1000
                };
    socket.emit('create-room', roomObj);
    event.preventDefault();

  }

  render(){
    return(
      <div>
        <form onSubmit={this._createRoom}>
        <div>
        <input id="name" type="text" name="name" value={this.state.name} onChange={this.handleChange}/>
        </div>
        <div>
        <input id="timeout" type="number" name="timeout" value={this.state.timeout} onChange={this.handleChange}/>
        </div>
        <div>
        <select id="selectmode" name="mode" value={this.state.mode} onChange={this.handleChange}>
        <option value="std" >standard</option>
        <option value="sup" >Super</option>
        </select>
        </div>
        <input type="submit" value="Submit"/>
      </form>
      </div>
    );
  }

}

class Full extends Component{
  constructor(props){
    super(props);
    this.state = {

    };
  }
  render(){
    return(<div><GameList/><CreateRoom/></div>);
  }
}

export default Full;
