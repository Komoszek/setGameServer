import React, { Component } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Link
} from 'react-router-dom';
import './App.css';

import Lobby from './Lobby';
import Room from './Room';

class App extends Component {
  render() {
    return (
      <Router>
      <div id="MainContainer">
      <div id="TopBar">
      </div>
        <div className="container">
          <Route exact path="/" component={Lobby} />
          <Route path="/room" component={Room} />
        </div>
        </div>
      </Router>
    );
  }
}

export default App;
