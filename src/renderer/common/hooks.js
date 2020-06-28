const { remote } = window.require('electron')
const { Menu, MenuItem, clipboard, shell } = remote

import { ref, onMounted, onUnmounted } from '@vue/composition-api'

export const useContextMenu = (options = []) => {
  const win = remote.getCurrentWindow()
  const menu = new Menu()

  const element = ref(null)

  options.map(option => {
    menu.append(new MenuItem(option || {}))
  })

  const handler = e => {
    e.preventDefault()
    menu.popup({ window: win })
  }

  onMounted(() => {
    element.value.addEventListener('contextmenu', handler, false)
  })

  onUnmounted(() => {
    element.value.removeEventListener('contextmenu', handler, false)
  })

  return { element }
}

export const useClipboard = () => {
  const handler = text => clipboard.writeText(text)

  return handler
}

export const useFilePreview = () => {
  const handler = path => shell.openItem(path)

  return handler
}