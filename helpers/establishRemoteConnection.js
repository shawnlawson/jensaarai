'use babel'

import RemoteConnection from '../RemoteConnection'
import destroySession from './destroySession'

export default function establishRemoteConnection(self, sessionID) {
  if (sessionID != null) {
    let sharedSession = new RemoteConnection(atom.workspace.getActiveTextEditor(), atom.workspace.getActivePaneItem(), sessionID)

    // Registers listeners for connection and share deactivation
    self.subscriptions.add(sharedSession.onDidConnect(() => {
      // Adds share to the stack and updates UI
      self.shareStack.push(sharedSession)
      self.updateShareView()
    }))
    self.subscriptions.add(sharedSession.onDidDestroy(() => destroySession(self, sharedSession)))
  } else {
    // Notifies user that no session ID has been setted yet
    atom.notifications.addError('No session ID has been setted yet')
  }
}
 
