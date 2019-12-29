'use babel';

var fs = require('fs');
const Ghc = require('./ghc')
const BootTidal = require('./boot-tidal')

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
        this.start();
      },
      'jensaarai:tidalcycles_reboot': () => {
        this.destroy();
        this.start();
      }
    });

    atom.commands.add('atom-text-editor', {
      'jensaarai:tidalcycles_hush': () => this.hush()
    });
    this.start() //added
  }

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
    this.stdTimer = setTimeout(() =>    this.flushStd(), 50);
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
    this.tidalSendLine(`:script ${bootPath}`)
  }

  tidalSendExpression(expression) {
    this.tidalSendLine(':{');

    expression.split('\n')
      .forEach(line => this.tidalSendLine(line));

    this.tidalSendLine(':}');
  }

  tidalSendLine(command) {
    this.ghci.writeLine(command);
  }

  destroy() {
    if (this.ghci) {
      this.ghci.destroy();
    }
  }


}
