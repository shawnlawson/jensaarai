'use babel'

import {CompositeDisposable} from 'atom'

export default class TR {

  editor: null
  recording: null
  start_time: 0
  start_text: ""
  which_event: 0
  total_events: 0
  total_time: 0.0
  play_start: 0.0
  elapsed_time = 0.0

  constructor() {
    this.subscriptions = new CompositeDisposable()

    this.editor = atom.workspace.getActiveTextEditor()

    this.subscriptions.add(atom.commands.add('atom-text-editor', {
      'jensaarai:save-recording': () => {
        this.save()
      },
      'jensaarai:stop-recording': () => {
        this.destroy()
      },
    }))

    var e = atom.workspace.getActiveTextEditor()
    this.subscriptions.add(
      //onDidChangeCursorPosition
      this.editor.onDidChangeSelectionRange((event) => {
        this.addCursor(event)
      }),
      this.editor.buffer.onDidChange((event) => {
        this.addChange(event)
      }),
      atom.workspace.getActivePane().onWillRemoveItem((event) => {
        if (this.recording !== null && event.item === e) {
          this.recording.save()
          this.recording.destroy()
        }
      })
    )

    this.erase()
    this.start_text = this.editor.getText()
    this.start_time = Date.now()
  }

  startRecording() {
    //for play/plause?
    console.log(this.start_time)
  }

  stopRecording() {

  }

  erase() {
    this.recording = []
  }

  save() {
    var e = {
      "version": 6,
      "playback": 1,
      "editor_type": "atom",
      "initial_text": this.start_text,
      "action": this.recording,
      "local_end_time": Date.now(),
      "local_start_time": this.start_time,
      "final_text": this.editor.getText()
    }

    var editor = atom.workspace.buildTextEditor()
    editor.insertText(JSON.stringify(e, null, '  '))
    atom.workspace.getActivePane().saveItem(editor, null)
  }

  addCursor(event) {
    if (!this.ignoreChanges) {
      //check event.cursor
      var e = {
        'p': 'u',
        't': Date.now() - this.start_time,
        'd': event.newBufferRange.serialize()
      }
      this.recording.push(e)
    }
  }

  addChange(event) {
    if (!this.ignoreChanges) {
      for (const {
          oldRange,
          newText
        } of event.changes.reverse()) {
        var e = {
          'p': 'c',
          't': Date.now() - this.start_time,
          'd': oldRange.serialize(),
          // 'a': 'replace',
          'c': newText
        }
        this.recording.push(e)
      }
    }
  }

  addEval(evalType, expression, range, language) {
    if (!this.ignoreChanges) {
      var e = {
        'p': 'e',
        't': Date.now() - this.start_time,
        'd': range.serialize()
        'c': expression,
        'l': language
      }
      this.recording.push(e)
    }
  }

  destroy() {
    this.save()
    this.subscriptions.dispose()
  }

}
