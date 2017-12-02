import React from 'react';
import ReactDOM from 'react-dom';
import Room from './Room';
import registerServiceWorker from './registerServiceWorker';

ReactDOM.render(<Room />, document.getElementById('root'));
registerServiceWorker();
