'use babel'

import {CompositeDisposable} from 'atom'

export default class TR {

  editor: null
  buffer: null
  recording: null
  start_time: 0
  start_text: ""
  which_event: 0
  total_events: 0
  total_time: 0.0
  play_start: 0.0
  elapsed_time = 0.0
  timer: null
  status_timer: null

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

    this.subscriptions.add(
      //onDidChangeCursorPosition
      this.editor.onDidChangeSelectionRange((event) => {
        this.addCursor(event)
      }),
      this.editor.buffer.onDidChange((event) => {
        this.addChange(event)
      })
    )

    this.erase()
    this.start_text = this.editor.getText()
  }

  startRecording() {
    this.start_time = Date.now()
    console.log(this.start_time)
  }

  stopRecording() {

  }

  startPlayback() {
    this.play_start = Date.now() - this.elapsed_time
    this.handle_event()
  }

  pausePlayback() {

  }

  rewindPlayback() {

  }

  handle_event() {
    // while (this.which_event < this.total_events) {
    //   var event_time = this.data['action'][self.which_event]['time']
    //   if this.play_start - time.time() + event_time < 0.0
    //     this.do_event(true)
    //   else
    //     break
    // }
    //
    // if (self.which_event >= self.total_events) {
    //   // and out of time
    //   if (this.elapsed_time >= this.total_time) {
    //     this.stop()
    //   }
    // } else {
    //   event_time = this.data['action'][this.which_event]['time']
    //   when = this.play_start - time.time() + event_time
    //   this.timer = setTimeout(() => this.do_event, when)
    //   this.timer.start()
    // }
    // this.tick = setTimeout (() =>  { this.startTicker() }, nextTick)
  }

  do_event() {
    // var event = this.data['action'][this.which_event]
    //
    // if ('u' in event['type'])
    //   // this.owner.recv_local_cursor(event)
    //   continue
    // else if ('c' in event['type'])
    //   continue
    //   // this.owner.recv_changes(event)
    // else if ('e' in event['type'])
    //   continue
    //   // this.owner.recv_executes(event)
    // else if ('o' in event['type'])
    //   continue
    //   // this.owner.recv_remote_cursor(event)
    //
    // this.which_event += 1
    // if not ignore:
    //   this.handle_event()
  }

  open() {
    // self.data = None
    //     with open(self.filename, 'r') as f:
    //         self.data = json.load(f)
    //     self.owner.view.window().run_command(
    //         "replace_jensaarai_main",
    //         {"text": self.data["initial_text"], "region": None})
    //     self.owner.view.sel().clear()
    //     self.owner.view.sel().add(sublime.Region(0, 0))
    //     self.total_time = (self.data["local_end_time"] -
    //                        self.data["local_start_time"])
    //     self.total_events = len(self.data['action'])
    //     self.owner.view.window().focus_view(self.owner.view)
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
        'type': 'u',
        'time': Date.now() - this.start_time,
        'change': event.newBufferRange.serialize()
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
          'type': 'c',
          'time': Date.now() - this.start_time,
          'change': oldRange.serialize(),
          'action': 'replace',
          'text': newText
        }
        this.recording.push(e)
        // this.recording.push(JSON.stringify(e))
      }
    }
  }

  addEval(event) {
    if (!this.ignoreChanges) {
      var e = {
        'type': 'e',
        'time': Date.now() - this.start_time,
        'change': oldRange.serialize(),
        'lang': 'python'//some language
      }
      this.recording.push(e)
      // this.recording.push(JSON.stringify(e))
    }
  }

  destroy() {
    this.save()
    this.subscriptions.dispose()
  }

}
