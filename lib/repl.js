'use babel';

var fs = require('fs');
const Ghc = require('./ghc')
const BootTidal = require('./boot-tidal')
var CONST_LINE = 'line'
var CONST_MULTI_LINE = 'multi_line'

export default class REPL {

  ghci: null
  consoleView: null
  stdErr: null
  stdOut: null
  stdTimer: 0

  constructor(consoleView) {
    this.consoleView = consoleView;
    this.stdErr = []
    this.stdOut = []

    atom.commands.add('atom-workspace', {
      'jensaarai:tidalcycles_boot': () => {
        // if (this.editorIsTidal()) {
            this.start();
            // return;
        // }
        // console.error('Not a .tidal file.');
      },
      'jensaarai:tidalcycles_reboot': () => {
        this.destroy();
        this.start();
      }
    });

    atom.commands.add('atom-text-editor', {
    //     'tidalcycles:eval': () => this.eval(CONST_LINE, false),
    //     'tidalcycles:eval-multi-line': () => this.eval(CONST_MULTI_LINE, false),
    //     'tidalcycles:eval-copy': () => this.eval(CONST_LINE, true),
    //     'tidalcycles:eval-multi-line-copy': () => this.eval(CONST_MULTI_LINE, true),
        'jensaarai:tidalcycles:hush': () => this.hush()
    });

  }

  // editorIsTidal() {
  //     var editor = this.getEditor();
  //     if (!editor) return false;
  //     return editor.getGrammar().scopeName === 'source.tidalcycles';
  // }

  start() {
    this.consoleView.initUI();
    this.ghci = Ghc.interactive()
      .on('stderr', data => { this.processStdErr(data) })
      .on('stdout', data => { this.processStdOut(data) })

    this.initTidal();
  }

  hush() {
    this.tidalSendExpression('hush');
  }

  processStdOut(data) {
    this.stdOut.push(data.toString('utf8'))
    this.processStd()
  }

  processStdErr(data) {
    this.stdErr.push(data.toString('utf8'))
    this.processStd()
  }

  processStd() {
    clearTimeout(this.stdTimer)
    // defers the handler of stdOut/stdErr data
    // by some arbitrary ammount of time (50ms)
    // to get the buffer filled completly
    this.stdTimer = setTimeout(() => this.flushStd(), 50);
  }

  flushStd() {

    if (this.stdErr.length) {
      let t = this.stdErr.join('')
      if (atom.config.get('jensaarai.filterPromptFromLogMessages')) {
        t = t.replace(/<interactive>.*error:/g, "")
        t = t.replace(/ \(bound at.*/g, "")
      }
      this.consoleView.logStderr(t);
      this.stdErr.length = 0
      //dont care about stdOut if there are errors
      this.stdOut.length = 0

    }

    if (this.stdOut.length) {
      let t = this.stdOut.join('')
      if (atom.config.get('jensaarai.filterPromptFromLogMessages')) {
        t = t.replace(/tidal>.*Prelude>/g, "")
        t = t.replace(/tidal>/g, "")
        t = t.replace(/Prelude>/g, "")
        t = t.replace(/Prelude.*\|/g, "")
        t = t.replace(/GHCi.*help/g, "")
        t = "t>" + t + "\n"
      }
      this.consoleView.logStdout(t);
      this.stdOut.length = 0
    }

  }

  initTidal() {
    const bootPath = BootTidal.getPath()
    this.consoleView.logStdout(`Load BootTidal.hs from ${bootPath}`)
    try {
      const blocks = fs.readFileSync(bootPath)
        .toString()
        .split('\n\n')
        .map(block => block.replace(":{", "").replace(":}", ""));

      blocks.forEach(block => {
        if (block.startsWith(":set")) {
          block.split("\n").forEach(row => this.tidalSendLine(row))
        } else {
          this.tidalSendExpression(block);
        }
      });
    } catch (err) {
      this.consoleView.logStderr(`Error initializing Tidal: ${err}`)
    }
  }

  tidalSendExpression(expression) {
    this.tidalSendLine(':{');
    var splits = expression.split('\n');
    for (var i = 0; i < splits.length; i++) {
      this.tidalSendLine(splits[i]);
    }
    this.tidalSendLine(':}');
  }

  tidalSendLine(command) {
    this.ghci.writeLine(command);
  }

  getEditor() {
    return atom.workspace.getActiveTextEditor();
  }

  eval(evalType, copy, language) {
    // if (!this.editorIsTidal()) return;

    // if (!this.ghci) this.start();

    var expressionAndRange = this.currentExpression(evalType);
    var expression = expressionAndRange[0];
    var range = expressionAndRange[1];
    this.evalWithRepl(expression, range, copy, language);
  }

  evalWithRepl(expression, range, copy, language) {
    var self = this
    if (!expression || language !== 'tidal') return;

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

      self.tidalRepl.tidalSendExpression(expression)
      onSuccess();
    }

    doIt();
  }

  destroy() {
    if (this.ghci) {
      this.ghci.destroy();
    }
  }


}
