'use babel'

export default class TouchDesignerView {

  touchDesignerConsole = null
  log = null

  initUI() {
    if (this.touchDesignerConsole) return;
    this.touchDesignerConsole = document.createElement('div');
    this.touchDesignerConsole.setAttribute('tabindex', -1);
    this.touchDesignerConsole.classList.add('touchdesigner', 'console', 'native-key-bindings');
    this.touchDesignerConsole.setAttribute('style', 'overflow-y: scroll;')

    this.log = document.createElement('div');
    this.touchDesignerConsole.appendChild(this.log);

    atom.workspace.open({
      element: this.touchDesignerConsole,
      getTitle: () => 'TouchDesigner',
      getURI: () => 'atom://jensaarai/touch-designer-view',
      getDefaultLocation: () => 'bottom'
    }, {  activatePane: false});

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
      this.touchDesignerConsole.classList.add('hidden');
    } else {
      this.touchDesignerConsole.classList.remove('hidden');
    }

    this.touchDesignerConsole.scrollTop = this.touchDesignerConsole.scrollHeight;
  }

  serialize() {

  }

  destroy() {
    this.touchDesignerConsole.remove()
  }

}
