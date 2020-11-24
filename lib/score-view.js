'use babel'

export default class ScoreView {

  scoreConsole = null
  log = null

  initUI() {
    if (this.scoreConsole) return;
    this.scoreConsole = document.createElement('div');
    // this.scoreConsole.setAttribute('tabindex', -1);
    // this.scoreConsole.classList.add('touchdesigner', 'console', 'native-key-bindings');
    // this.scoreConsole.setAttribute('style', 'overflow-y: scroll;')

    this.log = document.createElement('div');
    this.scoreConsole.appendChild(this.log);

    atom.workspace.open({
      element: this.scoreConsole,
      getTitle: () => 'ScoreConsole',
      getURI: () => 'atom://jensaarai/score-view',
      getDefaultLocation: () => 'bottom'
    }, {activatePane: false});

    atom.workspace.getBottomDock().show()
  }

  logText(text) {
    if (!text) return;
    var pre = document.createElement("pre");

    this.log.innerHTML = "";

    pre.innerHTML = text;
    this.log.appendChild(pre);

    this.scoreConsole.scrollTop = this.scoreConsole.scrollHeight;
  }

  serialize() {}

  destroy() {
    this.scoreConsole.remove()
  }

}
