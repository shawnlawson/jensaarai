'use babel';

import OSC from 'osc-js'
import {CompositeDisposable} from 'atom'

export default class TD {

  consoleView= null
  oscServer= null
  subscriptions= null
  markers = []

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
          this.editor.onDidStopChanging(({changes})=>{
            //quick fix for local glsl, does not work for remote glsl
            //changes needs to be compared to cursor in the evaluator
            cursors = this.editor.getCursors()
            for (var i = 0;  i < changes.length; i++) {
              for (var j = 0; j < cursors.length; j++) {
                if (changes[i].newRange.containsPoint(cursors[j].getBufferPosition())) {
                  e.getGLSL(this.editor)
                  i = changes.length
                  j = cursors.length
                }
              }
            }

          })
        )
      }
      else {this.subscriptions.dispose()}
    })

    this.osc = new OSC({
      plugin: new OSC.DatagramPlugin({
        open: {
          host: '0.0.0.0', //'localhost'
          port: atom.config.get('jensaarai.OSCServerPort')
        },
        send: {
          host: atom.config.get('jensaarai.TouchDesignerIP'),
          port: atom.config.get('jensaarai.TouchDesignerPort')
        }
      })
    })
    this.osc.on('open', () => {console.log('td osc open')})
    this.osc.on('close', () => {console.log('td osc closed')})
    this.osc.on('error', (err) => {console.log('td error: ', err)})
    this.osc.on('/touchdesigner',
                (message) => this.consoleView.logText(message.args[0], false))
    this.osc.on('/glsl_feedback',
                (message) => this.GLSLFeedback(message))
    this.osc.open()
  }

  send(language, expression) {
    this.osc.send(new OSC.Message('/'+language, expression))
  }

  GLSLFeedback(message) {
    var msg = message.args
    for (var i = 0; i < this.markers.length; i++) {this.markers[i].destroy()}
    var lines = msg[0].match(/^.*((\r\n|\n|\r)|$)/gm)
    var result = ""
    if (lines[0] === 'noError') {result = 'noError'}
    else {
      for (var i = 0; i < lines.length; i++) {
        var parts = lines[i].split(':')
        var temp = 0
        if (parts.length === 4 ) {
          temp = parseInt(parts[2]) + this.getStartGLSL() - 56
          result += parts[0] +':'+ parts[1] +' : '+ temp +' : '+ parts[3] +'\n'
          this.addMarker(temp)
        }
        else if (parts.length === 5 || parts.length === 6) {
          temp = parseInt(parts[2]) + this.getStartGLSL() - 56
          result += parts[0] +':' + parts[1] +' : '+ temp +' : '+ parts[3] +' : '+ parts[4] + '\n'
          this.addMarker(temp)
        }
      }
    }
   this.consoleView.logText(result)
  }

  addMarker(where){
    var marker = this.editor.markBufferRange(
      [[where-1, 0],[where, 0]],
      {invalidate: 'never'});

    var decoration = this.editor.decorateMarker(
      marker, {
        type: 'line',
        class: 'line-error'
      });
    this.markers.push(marker)
  }

  getStartGLSL() {
    if (!this.editor) return;
    var cursor = this.editor.getLastCursor();
    var startRow = endRow = cursor.getBufferRow();
    var lineCount = this.editor.getLineCount();
    while (startRow >= 0) {
      if (/[#\/\- ]*glsl/.test(this.editor.lineTextForBufferRow(startRow)))
        break
      startRow--;
    }
    return startRow
  }

  destroy() {
    this.osc.close()
    this.subscriptions.dispose()
  }

}
