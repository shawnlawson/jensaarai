const etch = require('etch')
const $ = etch.dom


module.exports =
class PopoverComponent {
  constructor (props) {
    this.props = props

    etch.initialize(this)
  }

  update () {
    return etch.update(this)
  }

  render () {
    return $.div({className: 'PlaybackPopoverComponent'})
  }
}
