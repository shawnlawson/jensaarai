'use babel'

export default function destroySession(self, sharedSession) {
  // Checks if shared session in the stack
  let shareStackIndex = self.shareStack.indexOf(sharedSession)
  if (shareStackIndex !== -1) {
    // Removes share session from the stack and updates UI
    self.shareStack.splice(shareStackIndex, 1)
    self.updateShareView()
  } else {
    // Logs an error message
    console.error(sharedSession, 'not found')
  }
}
