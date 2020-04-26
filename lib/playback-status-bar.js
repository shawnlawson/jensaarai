const {CompositeDisposable} = require('atom')
const PopoverComponent = require('./popover-component')

module.exports =
class PlaybackStatusBar {
  constructor (props) {
    this.props = props
    this.subscriptions = new CompositeDisposable()
    this.element = buildElement(props)
    this.popoverComponent = new PopoverComponent(props)

  }

  attach () {
    this.tile = this.props.statusBar.addLeftTile({
      item: this,
      priority: 100
    })
    this.tooltip = atom.tooltips.add(
      this.element,
      {
        item: this.popoverComponent,
        class: 'PlaybackPopoverTooltip',
        trigger: 'click',
        placement: 'top'
      }
    )
  }

  destroy () {
    if (this.tile) this.tile.destroy()
    if (this.tooltip) this.tooltip.dispose()
    this.subscriptions.dispose()
  }

  showPopover () {
    if (!this.isPopoverVisible()) this.element.click()
  }

  hidePopover () {
    if (this.isPopoverVisible()) this.element.click()
  }

  isPopoverVisible () {
    return document.contains(this.popoverComponent.element)
  }

  async updatePortalStatus () {

  }
}

function buildElement (props) {
  const anchor = document.createElement('a')
  anchor.classList.add('PlaybackStatusBar', 'inline-block')
  var text = document.createTextNode("")
  anchor.appendChild(text)
  return anchor
}
