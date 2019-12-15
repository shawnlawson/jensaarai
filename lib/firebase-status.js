'use babel'

const {CompositeDisposable} = require('atom')
const PopoverComponent = require('./popover-component')

export default class FirebaseStatus {
  constructor (props) {
    this.props = props
    this.subscriptions = new CompositeDisposable()
    this.element = buildElement()
    this.popoverComponent = new PopoverComponent(props)

    if (props.portalBindingManager) {
      this.portalBindingManager = props.portalBindingManager
      this.subscriptions.add(this.portalBindingManager.onDidChange(() => {
        this.updatePortalStatus()
      }))
    }

  }

  attach () {
    const PRIORITY_BETWEEN_BRANCH_NAME_AND_GRAMMAR = -40
    this.tile = this.props.statusBar.addRightTile({
      item: this,
      priority: PRIORITY_BETWEEN_BRANCH_NAME_AND_GRAMMAR
    })
    subscriptions.add(
      atom.tooltips.add(
        this.element,
        {
          item: this.popoverComponent,
          class: 'TeletypePopoverTooltip',
          trigger: 'click',
          placement: 'top'
        }
      )
    )
  }

  destroy () {
    if (this.tile) this.tile.destroy()
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
    const transmitting = await this.portalBindingManager.hasActivePortals()
    if (transmitting) {
      this.element.classList.add('transmitting')
    } else {
      this.element.classList.remove('transmitting')
    }
  }
}

function buildElement () {
  const anchor = document.createElement('a')
  anchor.classList.add('FirebaseStatus', 'inline-block')

  const icon = document.createElement('span')
  icon.classList.add('icon', 'icon-radio-tower')
  anchor.appendChild(icon)

  return anchor
}
