'use babel'

import ShareWorkspace from '../ShareWorkspace'
import destroySession from './destroySession'

export default function createShareSession(self, sessionID) {
  if (sessionID != null) {
    let editor = atom.workspace.getActiveTextEditor()
    let editorIsAlreadyShared = false

    // Checks if current file is already shared
    for (let share of self.shareStack) {
      if (share.getEditor() === editor) {
        editorIsAlreadyShared = true
      }
    }

    if (!editorIsAlreadyShared) {
      // Creates a new share session
      let sharedSession = new ShareWorkspace(editor, atom.workspace.getActivePaneItem(), sessionID)

      // Registers a listener for share deactivation
      self.subscriptions.add(sharedSession.onDidDestroy(() => destroySession(self, sharedSession)))

      // Adds share session to the stack and updates UI
      self.shareStack.push(sharedSession)
      self.updateShareView()
    } else {
      // Notifies user that current file is already shared
      atom.notifications.addWarning('This file is already shared!')
    }
  } else {
    // Notifies user that no session ID has been setted yet
    atom.notifications.addError('No session ID has been setted yet')
  }
}
