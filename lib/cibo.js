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
      if ('u' === recv.p){
        // this.editor.setCursorBufferPosition()
        this.editor.setSelectedBufferRange(recv.d)
      }
      else if ('c' === recv.p){
        this.editor.setTextInBufferRange(recv.d, recv.c)
      }
      else if ('e' === recv.p){
        this.package.evaluator.localEval(CONST_MULTI_LINE, false, recv.l, this.editor)
      }
      else if ('o' === recv.p){
  //this.check if first add?
  //this.editor.addcursor?
      }
    }

  }

  destroy() {
    this.touchDesignerClient.close()
    this.oscServer.close()
    this.subscriptions.dispose()
  }

}
