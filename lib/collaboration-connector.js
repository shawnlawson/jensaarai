'use babel';

var firebase = require('firebase')
import Firepad from './firepad'
import { CompositeDisposable } from 'atom';

export default class CC {

  constructor(local){
    if (true === local) {
      firebase.initializeApp({
        databaseURL: atom.config.get('jensaarai.FirebaseServer')
      })
      this.connectLocal()
    } else {
      config = {
        apiKey: atom.config.get('jensaarai.RemoteFirebaseKey'),
        authDomain: atom.config.get('jensaarai.RemoteFirebaseDomain'),
        databaseURL: atom.config.get('jensaarai.RemoteFirebaseDBURL')
      }
      firebase.initializeApp(config)
      this.connectRemote()
    }
  }

  connectLocal(){
    this.setupDB()
  }

  connectRemote(){
    firebase
      .auth()
      .signInWithEmailAndPassword(
        atom.config.get('jensaarai.FirebaseUser'),
        atom.config.get('jensaarai.FirebasePass'))
      .then(function() {
        this.setupDB()
      })
    .catch(function(error) {
      var errorCode = error.code;
      var errorMessage = error.message;
      console.log(errorCode + "\n" + errorMessage)
    })
  }

  setupDB(){
    console.log('connected')

    this.rootRef = firebase.database().ref()
    this.firepadRef = this.rootRef.child('atom_jensaarai')
    this.firepad = new Firepad.fromAtom(
      this.firepadRef,
      atom.workspace.getActiveTextEditor()
    )

    this.MessageRef = firebase.database().ref('messageExec/')
    this.MessageRef.on('child_added', function(data) {
      //if messages not by us
      if (data.val().author !== userId) {
        // record other user code executions
        // editor.livewriting(
        //   'record',
        //   data.val().range,
        //   data.val().exec,
        //   data.val().language
        // )
        // run other user code executions
        // editor.runCode(
        //   data.val().range,
        //   data.val().exec,
        //   data.val().language
        // )
        // delete the message
        this.MessageRef.child(data.key).remove()
        }
    })
  }


  destroy() {
    firebase.delete()
      .then(function() {
        console.log("App deleted successfully");
      })
      .catch(function(error) {
        console.log("Error deleting app:", error);
      });
  }
}
