'use babel';

import { Client, Server } from 'node-osc'
import {CompositeDisposable} from 'atom'
var CONST_LINE = 'line'
var CONST_MULTI_LINE = 'multi_line'

export default class Cibo {

  constructor(jensaarai) {
    this.package = jensaarai
    this.subscriptions = new CompositeDisposable()
    this.editor = atom.workspace.getActiveTextEditor()
    this.start()
  }

  start() {
    this.oscServer = new Server(
      atom.config.get('jensaarai.CiboServerPort'),
      '0.0.0.0'
    )
    this.oscServer.on('message', (msg) => this.parseOSC(msg))
    this.ciboClient = new Client(
      atom.config.get('jensaarai.CiboIP'),
      atom.config.get('jensaarai.CiboClientPort')
    )
  }

  send(language, expression) {
    this.ciboClient.send('/'+language, expression)
  }

  parseOSC(msg) {
    if (msg[0] === '/tidal_rewrite') {
      this.editor.setCursorBufferPosition([msg[1], 0])
      let s = this.editor.getCursorBufferPosition()
      this.editor.moveToEndOfLine()
      this.editor.buffer.setTextInRange(
        [s, this.editor.getCursorBufferPosition()],
        msg[2])

      // var recv = JSON.parse(msg[1]);
  //     if ('u' === recv.p){
  //       // this.editor.setCursorBufferPosition()
  //       this.editor.setSelectedBufferRange(recv.d)
  //     }
  //     else if ('c' === recv.p){
  //       this.editor.setTextInBufferRange(recv.d, recv.c)
  //     }
  //     else if ('e' === recv.p){
  //       this.package.evaluator.ciboEval(CONST_MULTI_LINE, recv.l, this.editor)
  //     }
  //     else if ('o' === recv.p){
  // //this.check if first add?
  // //this.editor.addcursor?
  //     }
    }
    else if (msg[0] === '/tidal_exec') {
      this.editor.setCursorBufferPosition([msg[1], 0])
      this.package.evaluator.ciboEval(CONST_MULTI_LINE, 'tidal', this.editor)
    }

  }

  destroy() {
    this.ciboClient.close()
    this.oscServer.close()
    this.subscriptions.dispose()
  }

}
