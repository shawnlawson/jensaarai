'use babel';

import { Client, Server } from 'node-osc'
import {CompositeDisposable} from 'atom'

export default class TD {

  consoleView: null
  oscServer: null
  subscriptions: null

  constructor(consoleView) {
    this.consoleView = consoleView;
    this.subscriptions = new CompositeDisposable()

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'jensaarai:startTouchDesigner': () => { this.start() },
      'jensaarai:stopTouchDesigner': () => { this.destroy() },
    }))

  }

  start() {
    this.touchDesignerView.initUI()

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

    this.oscServer = new Server(8888, '0.0.0.0')
    this.oscServer.on('message', (msg) => this.parseOSC(msg))
    this.touchDesignerClient = new Client('localhost', 9999)
  }

  getGLSL() {
    var editor = this.getEditor();
    if (!editor) return;
    var cursor = editor.getLastCursor();
    var startRow = endRow = cursor.getBufferRow();
    var lineCount = editor.getLineCount();
    while (startRow >= 0) {
      if (/[#\/\- ]*python/.test(editor.lineTextForBufferRow(startRow)))
        return
      if (/[#\/\- ]*tidal/.test(editor.lineTextForBufferRow(startRow)))
        return
      if (/[#\/\- ]*glsl/.test(editor.lineTextForBufferRow(startRow)))
        break
      startRow--;
    }
    while (endRow < lineCount) {
      if (/[#\/\- ]*python/.test(editor.lineTextForBufferRow(startRow)))
        break
      if (/[#\/\- ]*tidal/.test(editor.lineTextForBufferRow(startRow)))
        break
      endRow++
    }
    var range = {
      start: {
        row: startRow + 1,
        column: 0
      },
      end: {
        row: endRow - 1,
        column: 0
      },
    }
    return editor.getTextInBufferRange(range)
  }

  parseOSC(msg) {
    if (msg[0] === '/touchdesigner')
        this.touchDesignerView.logText(msg[1], false)
    //   // if (msg[0] === '/theforce')
    //       // this.touchDesignerView.logText(msg[1])
  }


  eval(evalType, copy, language) {
    var expressionAndRange = this.currentExpression(evalType);
    var expression = expressionAndRange[0];
    var range = expressionAndRange[1];
    this.evalWithRepl(expression, range, copy, language);
  }

  evalWithRepl(expression, range, copy, language) {
    var self = this
    if (!expression || language !== 'python' || language !== 'glsl') return;

    function doIt() {
      var unflash
      if (range) {
        unflash = self.evalFlash(range);
        var copyRange;
        if (copy) {
          copyRange = self.copyRange(range);
        }
      }

      function onSuccess() {
        if (unflash) {
          unflash('eval-success');
        }
      }

      self.touchDesignerClient.send('/'+language, expression)
      onSuccess();
    }

    doIt();
  }

  currentExpression(evalType) {
    var editor = this.getEditor();
    if (!editor) return;

    var selection = editor.getLastSelection();
    var expression = selection.getText();

    if (expression) {
      var range = selection.getBufferRange();
      return [expression, range];
    } else {
      if (evalType === CONST_LINE) {
        return this.getLineExpression(editor);
      }
      return this.getMultiLineExpression(editor);
    }
  }

  copyRange(range) {
      var editor = this.getEditor();
      var endRow = range.end.row;
      endRow++
      var text = editor.getTextInBufferRange(range);
      text = '\n' + text + '\n';

      if (endRow > editor.getLastBufferRow()) {
          text = '\n' + text
      }

      editor.getBuffer().insert([endRow, 0], text);
  }

getLineExpression(editor) {
  var cursor = editor.getCursors()[0];
  var range = cursor.getCurrentLineBufferRange();
  var expression = range && editor.getTextInBufferRange(range);
  return [expression, range];
}

getMultiLineExpression(editor) {
  var range = this.getCurrentParagraphIncludingComments(editor);
  var expression = editor.getTextInBufferRange(range);
  return [expression, range];
}

getCurrentParagraphIncludingComments(editor) {
  var cursor = editor.getLastCursor();
  var startRow = endRow = cursor.getBufferRow();
  var lineCount = editor.getLineCount();

  // lines must include non-whitespace characters
  // and not be outside editor bounds
  while (/\S/.test(editor.lineTextForBufferRow(startRow)) && startRow >= 0) {
    startRow--;
  }
  while (/\S/.test(editor.lineTextForBufferRow(endRow)) && endRow < lineCount) {
    endRow++;
  }
  return {
    start: {
      row: startRow + 1,
      column: 0
    },
    end: {
      row: endRow,
      column: 0
    },
  };
}

evalFlash(range) {
  var editor = this.getEditor();
  var marker = editor.markBufferRange(range, {
    invalidate: 'touch'
  });

  var decoration = editor.decorateMarker(
    marker, {
      type: 'line',
      class: 'eval-flash'
    });

  // return fn to flash error / success and destroy the flash
  return function(cssClass) {
    decoration.setProperties({
      type: 'line',
      class: cssClass
    });
    var destroy = function() {
      marker.destroy();
    };
    setTimeout(destroy, 120);
  };
}

  destroy() {
    this.touchDesignerClient.close()
    this.oscServer.destroy()
    const editor = this.getEditor()
    editor.onDidStopChanging(()=>{})
  }

}
