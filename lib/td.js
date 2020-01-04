'use babel';

import {Client, Server} from 'node-osc'
import {CompositeDisposable} from 'atom'

export default class TD {

  consoleView= null
  oscServer= null
  subscriptions= null

  constructor(consoleView) {
    this.consoleView = consoleView;
    this.editor = atom.workspace.getActiveTextEditor()
    this.subscriptions = new CompositeDisposable()
  }

  init(evaluator) {
    this.editor.observeGrammar((grammar) => {
      var e = evaluator
      if (grammar.name === "TheForce") {
        this.subscriptions.add(
          this.editor.onDidStopChanging(()=>{
            e.getGLSL(this.editor)
          })
        )
      }
      else {this.subscriptions.dispose()}
    })

    this.oscServer = new Server(
      atom.config.get('jensaarai.OSCServerPort'),
      '0.0.0.0')
    this.oscServer.on('message', (msg) => this.parseOSC(msg))
    this.touchDesignerClient = new Client(
      atom.config.get('jensaarai.TouchDesignerIP'),
      atom.config.get('jensaarai.TouchDesignerPort'))
  }

  send(language, expression) {
    this.touchDesignerClient.send('/'+language, expression)
  }

  parseOSC(msg) {
    if (msg[0] === '/touchdesigner')
        this.consoleView.logText(msg[1], false)
    //   // if (msg[0] === '/theforce')
    //       // this.consoleView.logText(msg[1])
  }

  destroy() {
    this.touchDesignerClient.close()
    this.oscServer.close()
    this.subscriptions.dispose()
  }

}
