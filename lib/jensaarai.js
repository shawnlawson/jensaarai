'use babel'
import TouchDesignerView from './touch-designer-view'
import TidalCyclesView from './tidalcycles-view'
import Repl from './repl'
import { Client, Server } from 'node-osc'
import {CompositeDisposable} from 'atom'
const WebSocket = require('ws')

export default {
  touchDesignerView: null,
  touchDesignerClient: null,
  tidalCyclesView: null,
  tidalRepl: null,
  theForceView: null,
  oscServer: null,
  subscriptions: null,

  config: {
    'OSCServerPort': {
      type: 'string',
      default: '8888',
      description: 'OSC Server Port'
    },
    'TouchDesignerPort': {
      type: 'string',
      default: '9999',
      description: 'Touch Designer Client Port'
    },
    'TouchDesignerIP': {
      type: 'string',
      default: 'localhost',
      description: 'Touch Designer Client IP'
    },
    'ghciPath': {
      type: 'string',
      default: '',
      description: 'Haskell (ghci) path'
    },
    'bootTidalPath': {
      type: 'string',
      default: ''
    },
    'onlyShowLogWhenErrors': {
      type: 'boolean',
      default: false,
      description: 'Only show console if last message was an error.'
    },
    'onlyLogLastMessage': {
      type: 'boolean',
      default: false,
      description: 'Only log last message to the console.'
    },
    'filterPromptFromLogMessages': {
      type: 'boolean',
      default: true,
      description: 'Whether to filter out those long prompt comming from ghci.'
    },
    'autocomplete': {
      type: 'boolean',
      default: true,
      description: 'Autocomplete code'
    },
    'hooglePath': {
      type: 'string',
      default: 'hoogle',
      description: 'Path of hoogle command, needed for documentation on autocomplete'
    }
  },

  activate(state) {
    this.oscServer = new Server(8888, '0.0.0.0')
    this.oscServer.on('message', (msg) => this.parseOSC(msg))
    this.subscriptions = new CompositeDisposable()
    // this.wss = new WebSocket.Server({ port: 8080 });
    //
    // this.wss.on('connection', function connection(ws) {
    //   ws.on('message', function incoming(message) {
    //     console.log('received: %s', message);
    //   });
    //
    //   ws.send('something');
    // });

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'jensaarai:startTouchDesigner': () => this.startTouchDesigner(),
      'jensaarai:startTidalCycles': () => this.startTidalCycles(),
      'jensaarai:stopTouchDesigner': () => this.stopTouchDesigner(),
      'jensaarai:stopTidalCycles': () => this.stopTidalCycles()
    }));

    this.subscriptions.add(atom.commands.add('atom-text-editor', {
      'jensaarai:eval': () => this.eval('line', false),
      'jensaarai:eval-multi-line': () => this.eval('multi_line', false),
      'jensaarai:eval-copy': () => this.eval('line', true),
      'jensaarai:eval-multi-line-copy': () => this.eval('multi_line', true)
      // this.subscriptions.add(atom.workspace.observeActivePaneItem(() => this.updateShareView() ))
      // 'jensaarai:hush': () => this.hush()
    }))
  },

  startTouchDesigner() {
    if (this.touchDesignerView !== null)
      this.stopTouchDesigner()
    this.touchDesignerView = new TouchDesignerView()
    this.touchDesignerView.initUI()
    this.touchDesignerClient = new Client('localhost', 9999)

    //move to activate?
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
  },

  stopTouchDesigner() {
    this.touchDesignerView.destroy()
    this.touchDesignerClient.close()
    const editor = this.getEditor()
    editor.onDidStopChanging(()=>{})
  },

  startTidalCycles() {
    if (this.tidalCyclesView !== null)
      this.stopTidalCycles()
    this.tidalCyclesView = new TidalCyclesView()
    this.tidalRepl = new Repl(this.tidalCyclesView)
  },

  stopTidalCycles() {
    this.tidalCyclesView.destroy()
    this.tidalRepl.destroy()
  },

  parseOSC(msg) {
    if (msg[0] === '/touchdesigner')
        this.touchDesignerView.logText(msg[1], false)
    //   // if (msg[0] === '/theforce')
    //       // this.touchDesignerView.logText(msg[1])
  },

  deactivate() {
    this.subscriptions.dispose()
    this.oscServer.destroy()
    this.touchDesignerView.destroy()
    this.touchDesignerClient.close()
    this.tidalCyclesView.destroy()
    this.oscServer.close();
  },

  serialize() {
    return {};
  },

  eval(evalType, copy) {
    var expressionAndRange = this.currentExpression(evalType);
    var expression = expressionAndRange[0];
    var range = expressionAndRange[1];
    var language = this.getLanguage()
    this.evalWithRepl(expression, range, copy, language);
  },

  evalWithRepl(expression, range, copy, language) {
    var self = this
    if (!expression) return;

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

      if (language === 'python' || language === 'glsl')
        self.touchDesignerClient.send('/'+language, expression)
      else if (language === 'tidal')
        self.tidalRepl.tidalSendExpression(expression)
      onSuccess();
    }

    doIt();
  },

  currentExpression(evalType) {
    var editor = this.getEditor();
    if (!editor) return;

    var selection = editor.getLastSelection();
    var expression = selection.getText();

    if (expression) {
      var range = selection.getBufferRange();
      return [expression, range];
    } else {
      if (evalType === 'line') {
        return this.getLineExpression(editor);
      }
      return this.getMultiLineExpression(editor);
    }
  },

  getLineExpression(editor) {
    var cursor = editor.getCursors()[0];
    var range = cursor.getCurrentLineBufferRange();
    var expression = range && editor.getTextInBufferRange(range);
    return [expression, range];
  },

  getMultiLineExpression(editor) {
    var range = this.getCurrentParagraphIncludingComments(editor);
    var expression = editor.getTextInBufferRange(range);
    return [expression, range];
  },

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
  },

  getLanguage() {
    var editor = this.getEditor();
    var cursor = editor.getLastCursor();
    var startRow = endRow = cursor.getBufferRow();
    var lineCount = editor.getLineCount();
    while (startRow >= 0) {
      if (/[#\/\- ]*python/.test(editor.lineTextForBufferRow(startRow)))
        return 'python'
      if (/[#\/\- ]*tidal/.test(editor.lineTextForBufferRow(startRow)))
        return 'tidal'
      if (/[#\/\- ]*glsl/.test(editor.lineTextForBufferRow(startRow)))
        return 'glsl'
      startRow--
    }
  },

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
  },

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
  },

  getEditor() {
    return atom.workspace.getActiveTextEditor();
  }


};
