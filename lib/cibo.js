'use babel';

import { Client, Server } from 'node-osc'
import {CompositeDisposable} from 'atom'
var CONST_LINE = 'line'
var CONST_MULTI_LINE = 'multi_line'

export default class Cibo {

  oscServer: null
  subscriptions: null

  constructor(consoleView) {
    this.subscriptions = new CompositeDisposable()

    this.start()
  }

  start() {
    const editor = this.getEditor()
    editor.observeGrammar((grammar) => {
      if (grammar.name === "TheForce") {
        editor.onDidStopChanging(()=>{
          var expression = this.getGLSL()
          console.log(expression)
          this.touchDesignerClient.send('/glsl', expression)
        })
      }else
        editor.onDidStopChanging(()=>{})
    })

    this.oscServer = new Server(
      atom.config.get('jensaarai.CiboServerPort'),
      '0.0.0.0')
    this.oscServer.on('message', (msg) => this.parseOSC(msg))
    this.touchDesignerClient = new Client(
      atom.config.get('jensaarai.CiboIP'),
      atom.config.get('jensaarai.CiboPort'))
  }

  parseOSC(msg) {
    if (msg[0] === '/tidal') {
      var recv = msg[1];
      if ('u' === event['type']) {
          // self.owner.recv_local_cursor(event)
      }
      else if ('c' === event['type']) {
          // self.owner.recv_changes(event)
      }
      else if ('e' === event['type']) {
          // self.owner.recv_executes(event)
      }
      else if ('o' === event['type']) {
          // self.owner.recv_remote_cursor(event)
      }

    }

  }

  destroy() {
    this.touchDesignerClient.close()
    this.oscServer.close()
    this.subscriptions.dispose()
  }

}
