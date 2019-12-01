'use babel'

export default function disconnect(self) {
  let editor = atom.workspace.getActiveTextEditor()
  let editorIsShared = false

  // Removes share session icon from the tab
  self.tabIcon.removeIcon(editor.getPath())

  for (let share of self.shareStack) {
    if (share.getEditor() === editor) {
      // Notifies user and disable file sharing
      atom.notifications.addSuccess('Successfuly disabled sharing on this file!')
      editorIsShared = true
      share.remove()
      break
    }
  }

  if (!editorIsShared) {
    // Notifies user that current file is not shared
    atom.notifications.addError('This file is not shared!')
  }
}
