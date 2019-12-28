'use babel'

import {CompositeDisposable} from 'atom'

export default class TP {

  editor: null
  recording: null
  start_time: 0
  which_event: 0
  total_events: 0
  total_time: 0.0
  play_start: 0.0
  elapsed_time = 0.0
  timer: null
  status_timer: null

  constructor(jensaarai) {
    this.subscriptions = new CompositeDisposable()
    this.package = jensaarai
    this.editor = atom.workspace.getActiveTextEditor()

    this.subscriptions.add(atom.commands.add('atom-text-editor', {
    }))
  }

  startPlayback() {
    this.play_start = Date.now() - this.elapsed_time
    this.handle_event()
  }

  pausePlayback() {
    if (this.timer !== null) {
      clearTimeout(this.timer)
      this.timer = null
    }
    this.elapsed_time = Date.now() - this.play_start
  }

  rewindPlayback() {
    this.pausePlayback()
    this.which_event = 0
    this.play_start = 0.0
    this.elapsed_time = 0.0
  }

  handle_event() {
    while (this.which_event < this.total_events) {
      // var event_time = this.data['action'][self.which_event]['time']
      if (this.play_start - Date.now() + event_time < 0.0)
        this.do_event(true)
      else
        break
    }
    //
    if (this.which_event >= this.total_events) {
    //   // and out of time
    //   if (this.elapsed_time >= this.total_time) {
    //     this.stop()
    //   }
    } else {
    //   event_time = this.data['action'][this.which_event]['time']
      when = this.play_start - Date.now() + event_time
      this.timer = setTimeout(this.do_event, when)
    }
  }

  do_event() {
    // var event = this.data['action'][this.which_event]

    if ('u' === event['type']){
      // this.editor.setCursorBufferPosition()
      //this.editor.setSelectedBufferRange()
    }
    else if ('c' === event['type']){
      this.editor.setTextInBufferRange()
    }
    else if ('e' === event['type']){
      // this.package.evaluator.
    }
    else if ('o' === event['type']){
//this.check if first add?
//this.editor.addcursor?
    }

    this.which_event += 1
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

  destroy() {
    this.subscriptions.dispose()
  }

}
