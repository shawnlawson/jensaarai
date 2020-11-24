'use babel';

import OSC from 'osc-js'
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
    this.osc = new OSC({
      plugin: new OSC.DatagramPlugin({
        open: {
          host: '0.0.0.0', //'localhost'
          port: atom.config.get('jensaarai.CiboServerPort')
        },
        send: {
          host: atom.config.get('jensaarai.CiboIP'),
          port: atom.config.get('jensaarai.CiboClientPort')
        }
      })
    })
    this.osc.on('open', () => {console.log('cibo osc open')})
    this.osc.on('close', () => {console.log('cibo osc closed')})
    this.osc.on('error', (err) => {console.log('cibo error: ', err)})
    this.osc.on('/tidal_rewrite', (message) => this.changeCode(message))
    this.osc.on('/tidal_exec', (message) => this.parseOSC(message))
    this.osc.open()
  }

  send(language, expression) {
    this.osc.send(new OSC.Message('/'+language, expression))
  }

  changeCode(message) {
    var msg = message.args
    this.editor.setCursorBufferPosition([msg[0], 0])
    let s = this.editor.getCursorBufferPosition()
    this.editor.moveToEndOfLine()
    this.editor.buffer.setTextInRange(
      [s, this.editor.getCursorBufferPosition()],
      msg[1])

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

  runCode(message){
    var msg = message.args
    this.editor.setCursorBufferPosition([msg[0], 0])
    this.package.evaluator.ciboEval(CONST_MULTI_LINE, 'tidal', this.editor)
  }

  destroy() {
    this.osc.close()
    this.subscriptions.dispose()
  }

}
