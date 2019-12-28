'use babel'
import TouchDesignerView from './touch-designer-view'
import TidalCyclesView from './tidalcycles-view'
import Repl from './repl'
import TD from './td'
import TR from './text-recording'
import CC from './collaboration-connector'
import Cibo from './cibo'
import Eval from './evaluator'
import {CompositeDisposable} from 'atom'

export default {
  touchDesignerView: null,
  tidalCyclesView: null,
  tdRepl: null,
  tidalRepl: null,
  recording: null,
  firebaseConnection: null,
  subscriptions: null,

  config: {
    'OSCServerPort': {
      type: 'integer',
      default: 8888,
      description: 'OSC Server Port'
    },
    'TouchDesignerPort': {
      type: 'integer',
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
    },
    'CiboServerPort': {
      type: 'integer',
      default: 9898,
      description: 'Cibo Server Port'
    },
    'CiboClientPort': {
      type: 'integer',
      default: 8989,
      description: 'Cibo Client Port'
    },
    'CiboIP': {
      type: 'string',
      default: 'localhost',
      description: 'Cibo Client IP'
    },

  },

  activate(state) {
    this.evaluator = new Evaluator(this)

    this.subscriptions = new CompositeDisposable()
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'jensaarai:start-tidal-cycles': () => this.startTidalCycles(state),
      'jensaarai:stop-tidal-cycles': () => this.stopTidalCycles(),
      'jensaarai:start-touch-designer': () => this.startTouchDesigner(state),
      'jensaarai:stop-touch-designer': () => this.stopTouchDesigner()
    }));

    this.subscriptions.add(atom.commands.add('atom-text-editor', {
      'jensaarai:eval': () => this.evaluator.eval('line', false),
      'jensaarai:eval-multi-line': () => this.evaluator.eval('multi_line', false),
      'jensaarai:eval-copy': () => this.evaluator.eval('line', true),
      'jensaarai:eval-multi-line-copy': () => this.evaluator.eval('multi_line', true),
      'jensaarai:start-recording': () => this.recording = new TR(),
      'firepad:local-connect': () => this.firebaseConnection = new CC(true, this),
      'firepad:remote-connect': () => this.firebaseConnection = new CC(false, this)
    }))
  },

  startTouchDesigner(state) {
    this.touchDesignerView = new TouchDesignerView(state.touchDesignerViewState)
    this.tdRepl = new TD(this.touchDesignerView)
  },

  stopTouchDesigner() {
    this.touchDesignerView.destroy()
    this.tdRepl.destroy()
  },

  startTidalCycles(state) {
    this.tidalCyclesView = new TidalCyclesView(state.tidalCyclesViewState)
    this.tidalRepl = new Repl(this.tidalCyclesView)
  },

  stopTidalCycles() {
    this.tidalCyclesView.destroy()
    this.tidalRepl.destroy()
  },

  async consumeStatusBar (statusBar) {
    // this.firebaseStatus = new FirebaseStatus({
    // })
    // this.firebaseStatus.attach()
  },

  deactivate() {
    this.subscriptions.dispose()
    stopTouchDesigner()
    stopTidalCycles()
    // if (this.portalStatusBarIndicator) this.portalStatusBarIndicator.destroy()
  }
};
