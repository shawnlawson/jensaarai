'use babel'

export default function copySessionID(self) {
  let editorIsShared = false

  for (let share of self.shareStack) {
    if (share.getEditor() === atom.workspace.getActiveTextEditor()) {
      // Notifies user and copies session ID to the clipboard
      atom.notifications.addSuccess('Session ID successfuly copied to the clipboard!')
      atom.clipboard.write(share.getSessionID())
      editorIsShared = true
      break
    }
  }

  if (!editorIsShared) {
    // Notifies user that the current file is not shared
    atom.notifications.addError('This file is not shared!')
  }
}
