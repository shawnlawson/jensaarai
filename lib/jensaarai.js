'use babel'
import TouchDesignerView from './touch-designer-view'
import TidalCyclesView from './tidalcycles-view'
import Repl from './repl'
import TD from './td'
import CC from './collaboration-connector'
import {CompositeDisposable} from 'atom'

export default {
  touchDesignerView: null,
  touchDesignerClient: null,
  tidalCyclesView: null,
  tdRepl: null,
  tidalRepl: null,
  theForceView: null,
  firebaseConnection: null,
  subscriptions: null,

  config: {
    'OSCServerPort': {
      type: 'int',
      default: 8888,
      description: 'OSC Server Port'
    },
    'TouchDesignerPort': {
      type: 'int',
      default: 9999,
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
    },
    'FirebaseServer': {
      type: 'string',
      default: 'ws://localhost:5555',
      description: 'Firebase Server with port '
    },
    'FirebaseUser': {
      type: 'string',
      default: '',
      description: 'Firebase User hint:email'
    },
    'FirebasePass': {
      type: 'string',
      default: '',
      description: 'Firebase Password'
    },
    'RemoteFirebaseKey': {
      type: 'string',
      default: '',
      description: 'Firebase API Key'
    },
    'RemoteFirebaseDomain': {
      type: 'string',
      default: '',
      description: 'Firebase Domain'
    },
    'RemoteFirebaseDBURL': {
      type: 'string',
      default: '',
      description: 'Firebase Database URL'
    }
  },

  activate(state) {
    this.subscriptions = new CompositeDisposable()
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'jensaarai:startTidalCycles': () => this.startTidalCycles(),
      'jensaarai:stopTidalCycles': () => this.stopTidalCycles()
    }));

    this.subscriptions.add(atom.commands.add('atom-text-editor', {
      'jensaarai:eval': () => this.eval('line', false),
      'jensaarai:eval-multi-line': () => this.eval('multi_line', false),
      'jensaarai:eval-copy': () => this.eval('line', true),
      'jensaarai:eval-multi-line-copy': () => this.eval('multi_line', true),
      'firepad:local-connect': () => this.firebaseConnection = new CC(true),
      'firepad:remote-connect': () => this.firebaseConnection = new CC(false)
      // this.subscriptions.add(atom.workspace.observeActivePaneItem(() => this.updateShareView() ))
      // 'jensaarai:hush': () => this.hush()
    }))
  },

  startTouchDesigner() {
    if (this.touchDesignerView !== null)
      this.stopTouchDesigner()
    this.touchDesignerView = new TouchDesignerView()
    this.tdRepl = new TD(this.touchDesignerView)
  },

  stopTouchDesigner() {
    this.touchDesignerView.destroy()
    this.tdRepl.destroy()
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

  async consumeStatusBar (statusBar) {
    // this.firebaseStatus = new FirebaseStatus({
    //
    // })
    // this.firebaseStatus.attach()
  },

  deactivate() {
    this.subscriptions.dispose()
    stopTouchDesigner()
    stopTidalCycles()
    if (this.portalStatusBarIndicator) this.portalStatusBarIndicator.destroy()
  },

  serialize() {
    //doesn't work yet
    // return {
    //   tidalCyclesView: this.tidalCyclesView.serialize(),
    //   touchDesignerView: this.touchDesignerView.serialize()
    // };
  },

  eval(evalType, copy) {
    var editor = atom.workspace.getActiveTextEditor();
    var cursor = editor.getLastCursor();
    var startRow = endRow = cursor.getBufferRow();
    var lineCount = editor.getLineCount();
    while (startRow >= 0) {
      if (/[#\/\- ]*python/.test(editor.lineTextForBufferRow(startRow)))
        this.tdRepl.eval(evalType, copy, 'python')
      if (/[#\/\- ]*tidal/.test(editor.lineTextForBufferRow(startRow)))
         this.tidalRepl.eval(evalType, copy, 'tidal')
      if (/[#\/\- ]*glsl/.test(editor.lineTextForBufferRow(startRow)))
        this.tdRepl.eval(evalType, copy, 'glsl')
      startRow--
    }
  },

};
