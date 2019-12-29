'use babel'

import {CompositeDisposable} from 'atom'

export default class TP {

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

    this.open()

    this.subscriptions.add(atom.commands.add('atom-text-editor', {
      'jensaarai:pause-playback': () => this.pausePlayback(),
      'jensaarai:rewind-playback': () => this.rewindPlayback(),

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
      var event_time = this.data.action[self.which_event].t
      if (this.play_start - Date.now() + event_time < 0.0)
        this.do_event(true)
      else
        break
    }

    if (this.which_event >= this.total_events) {
       // and out of time
      if (this.elapsed_time >= this.total_time) {
        this.pausePlayback()
      }
    } else {
      var event_time = this.data.action[this.which_event].t//['t']
      when = this.play_start - Date.now() + event_time
      this.timer = setTimeout(() => this.do_event(false), when)
    }
  }

  do_event(ignore) {
    var event = this.data.action[this.which_event]

    if ('u' === event.p){
      // this.editor.setCursorBufferPosition()
      this.editor.setSelectedBufferRange(event.d)
    }
    else if ('c' === event.p){
      this.editor.setTextInBufferRange(event.d, event.c)
    }
    else if ('e' === event.p){
      // this.package.evaluator.
    }
    else if ('o' === event.p){
//this.check if first add?
//this.editor.addcursor?
    }

    this.which_event += 1
    if (!ignore)
      this.handle_event()
  }

  open() {
    var pane = this.workspace.paneForItem(this.editor)
    this.workspace.open()
    this.openFile = atom.workspace.getActiveTextEditor()
    this.data = JSON.parse(this.editor.getText())
    pane.activate()

    this.editor.setText(this.data.initial_text)
    //set cursor or selection?
    this.total_time = this.data.local_end_time -
 this.data.local_start_time
    this.total_events = this.data.action.length
  }

  destroy() {
    this.subscriptions.dispose()
  }

}
