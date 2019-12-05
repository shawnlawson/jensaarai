'use babel'

export default class TidalCyclesView {

  constructor(serializedState) {
    this.tidalCyclesConsole = null
    this.log = null
  }

  initUI() {
    if (this.tidalCyclesConsole) return;
    this.tidalCyclesConsole = document.createElement('div');
    this.tidalCyclesConsole.setAttribute('tabindex', -1);
    this.tidalCyclesConsole.classList.add('touchdesigner', 'console', 'native-key-bindings');
    this.tidalCyclesConsole.setAttribute('style', 'overflow-y: scroll;')

    this.log = document.createElement('div');
    this.tidalCyclesConsole.appendChild(this.log);

    atom.workspace.open({
      element: this.tidalCyclesConsole,
      getTitle: () => 'TidalCycles',
      getURI: () => 'atom://jensaarai/tidalcycles-view',
      getDefaultLocation: () => 'bottom'
    }, {
      activatePane: false
    });

    atom.workspace.getBottomDock().show()
  }

  logStdout(text) {
    this.logText(text)
  }

  logStderr(text) {
    this.logText(text, true)
  }

  logText(text, error) {
    if (!text) return;
    var pre = document.createElement("pre");
    if (error) {
      pre.className = "error";
    }

    if (atom.config.get('jensaarai.onlyLogLastMessage')) {
      this.log.innerHTML = "";
    }
    pre.innerHTML = text;
    this.log.appendChild(pre);

    if (!error && atom.config.get('jensaarai.onlyShowLogWhenErrors')) {
      this.tidalCyclesConsole.classList.add('hidden');
    } else {
      this.tidalCyclesConsole.classList.remove('hidden');
    }

    this.tidalCyclesConsole.scrollTop = this.tidalCyclesConsole.scrollHeight;
  }

  serialize() {}

  destroy() {
    this.tidalCyclesConsole.remove()
  }

}
