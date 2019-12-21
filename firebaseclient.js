const firebase  = require('firebase/app');
require('firebase/database');

const app = firebase.initializeApp({
  databaseURL: 'ws://localhost:5555',
}, 'test');

app.database().ref().on('value', (snap) => {
  console.log('Got value: ', snap.val());
});

// ./node_modules/.bin/firebase-server -p 5555 -a 'localhost'
