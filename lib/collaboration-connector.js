'use babel';

var firebase = require('firebase')
import Firepad from './firepad'
import { CompositeDisposable } from 'atom';

export default class CC {

  constructor(local, jensaarai){
    this.editor = atom.workspace.getActiveTextEditor()
    this.package = jensaarai
    this.userId = Math.floor(Math.random() * 9999999999).toString()
    //destroy first?
    if (true === local) {
      firebase.initializeApp({
        userId: this.userId,
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
    var self = this

    this.rootRef = firebase.database().ref()
    this.firepadRef = this.rootRef.child('atom_jensaarai')
    this.firepad = new Firepad.fromAtom(
      this.firepadRef,
      this.editor
    )

    this.MessageRef = firebase.database().ref('messageExec/')
    this.MessageRef.on('child_added', function(data) {
      //if messages not by us
      if (data.val().author !== this.userId) {
      // if (data.val().author !== atom.config.get('jensaarai.FirebaseUser')) {
        self.package.evaluator.remoteEval(
          data.val().range,
          data.val().lang,
          self.editor
        )
        // this.MessageRef.child(data.key).remove()
      }
    })
  }

  addEval(range, language) {
    this.MessageRef.push({
      author: this.userId,
      // author: atom.config.get('jensaarai.FirebaseUser'),
      range: range,
      lang: language
    })
  }

  destroy() {
    firebase.delete()
            .then(() => {
              console.log("App deleted successfully");
            })
            .catch((error) => {
              console.log("Error deleting app:", error);
            })
  }
}
