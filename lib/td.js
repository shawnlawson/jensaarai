'use babel';

import {Client, Server} from 'node-osc'
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
          this.editor.onDidStopChanging(()=>{
            e.getGLSL(this.editor)
          })
        )
      }
      else {this.subscriptions.dispose()}
    })

    this.oscServer = new Server(
      atom.config.get('jensaarai.OSCServerPort'),
      '0.0.0.0'
    )
    this.oscServer.on('message', (msg) => this.parseOSC(msg))
    this.touchDesignerClient = new Client(
      atom.config.get('jensaarai.TouchDesignerIP'),
      atom.config.get('jensaarai.TouchDesignerPort')
    )
  }

  send(language, expression) {
    this.touchDesignerClient.send('/'+language, expression)
  }

  parseOSC(msg) {
    if (msg[0] === '/touchdesigner')
        this.consoleView.logText(msg[1], false)
    else if (msg[0] === '/glsl_feedback') {
        for (var i = 0; i < this.markers.length; i++) {this.markers[i].destroy()}
        var lines = msg[1].match(/^.*((\r\n|\n|\r)|$)/gm)
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
    this.touchDesignerClient.close()
    this.oscServer.close()
    this.subscriptions.dispose()
  }

}
