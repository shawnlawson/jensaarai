'use babel';

var firebase = require('firebase')
import Firepad from './firepad'
import { CompositeDisposable } from 'atom';

export default class CC {

  constructor(local, jensaarai){
    this.editor = atom.workspace.getActiveTextEditor()
    this.editor.buffer.setText("")
    this.package = jensaarai
    this.userId = atom.config.get('jensaarai.FirebaseUser')//Math.floor(Math.random() * 9999999999).toString()

    if (true === local) {
      if (!firebase.apps.length){
        firebase.initializeApp({
          userId: this.userId,
          databaseURL: atom.config.get('jensaarai.FirebaseServer')
        })
      }
      this.connectLocal()
    } else {
      config = {
        apiKey: atom.config.get('jensaarai.RemoteFirebaseKey'),
        authDomain: atom.config.get('jensaarai.RemoteFirebaseDomain'),
        databaseURL: atom.config.get('jensaarai.RemoteFirebaseDBURL')
      }
      if (!firebase.apps.length){firebase.initializeApp(config)}
      this.connectRemote()
    }

    this.subscriptions = new CompositeDisposable()
    this.subscriptions.add(atom.commands.add('atom-text-editor', {
      'firepad:glsl-language': () => this.addLanguage('glsl'),
      'firepad:python-language': () => this.addLanguage('python'),
      'firepad:tidal-language': () => this.addLanguage('haskell'),
    }))
  }

  connectLocal(){
    this.setupDB()
  }

  connectRemote(){
    var self = this
    firebase
      .auth()
      .signInWithEmailAndPassword(
        atom.config.get('jensaarai.FirebaseUser'),
        atom.config.get('jensaarai.FirebasePass'))
      .then(function() {
        try {
          self.setupDB()
        } catch (err) {
          atom.notifications.addError('error '+ err)
          this.destroy()
        }
      })
    .catch(function(error) {
      var errorCode = error.code;
      var errorMessage = error.message;
      atom.notifications.addError('errorCode + "\n" + errorMessage', errorCode, errorMessage)
    })
  }

  setupDB(){
    var self = this

    this.rootRef = firebase.database().ref()
    this.firepadRef = this.rootRef.child('atom_jensaarai')
    this.firepad = new Firepad.fromAtom(
      this.firepadRef,
      this.editor
    )

    this.messageRef = firebase.database().ref('messageExec/')
    this.messageRef.on('child_added', function(data) {
      //if messages not by us
      if (data.val().author !== self.userId) {
        self.package.evaluator.remoteEval(
          data.val().range,
          data.val().lang,
          self.editor
        )
        self.messageRef.child(data.key).remove()
      }
    })

    this.languageRef = firebase.database().ref('language/')
    //TODO::: onDisconnet delete userid in DB

    atom.notifications.addSuccess('firepad connected')
  }

  addEval(range, language) {
    this.messageRef.push({
      author: this.userId,
      // author: atom.config.get('jensaarai.FirebaseUser'),
      range: range,
      lang: language
    })
  }

  addLanguage(language) {
    this.languageRef.push({
      highlight: language
    })
  }

  destroy() {
    // this.app.delete()
    // // firebase.delete()
    //   .then(() => {
    //     atom.notifications.addSuccess('firepad disconnected')
    //   })
    //   .catch((error) => {
    //     atom.notifications.addError('error '+ error)
    //   })
    this.firepad.dispose()
    this.subscriptions.dispose()
  }
}
