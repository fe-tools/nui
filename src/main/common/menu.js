import { EventEmitter } from 'events'

import { shell, Menu } from 'electron'

import { isMac, isDev } from './env'
import { name, homepage } from '../../../package.json'

const openHomePage = () => shell.openExternal(homepage)

class MenuManager extends EventEmitter {
  constructor(extraMenu) {
    super()

    const template = []

    template.push(isMac
    ? {
        label: name,
        submenu: [
          { label: '关于', role: 'about' },
          { type: 'separator' },
          { label: '设置', click: () => this.emit('setting') },
          { type: 'separator' },
          { label: '服务', role: 'services' },
          { type: 'separator' },
          { label: '隐藏', role: 'hide' },
          { label: '隐藏其他应用', role: 'hideothers' },
          { label: '显示全部', role: 'unhide' },
          { type: 'separator' },
          { label: '退出', role: 'quit' }
        ]
      }
    : {
        label: '设置',
        click: () => this.emit('setting')
      }
    )

    template.push(
      {
        label: '编辑',
        submenu: [
          { label: '撤销', role: 'undo' },
          { label: '恢复', role: 'redo' },
          { type: 'separator' },
          { label: '剪切', role: 'cut' },
          { label: '复制', role: 'copy' },
          { label: '粘贴', role: 'paste' },
          { label: '删除', role: 'delete' },
          { type: 'separator' },
          { label: '全选', role: 'selectAll' }
        ]
      }
    )
    
    // add extra option to menu
    if (Array.isArray(extraMenu)) {
      template.push(
        ...extraMenu
      )
    }

    template.push(isMac
    ? {
        label: '窗口',
        submenu: [
          { label: '最小化', role: 'minimize' },
          { label: '缩放', role: 'zoom' },
          { type: 'separator' },
          { label: '前置所有窗口', role: 'front' }
        ]
      }
    : {
        label: '窗口',
        submenu: [
          { label: '关闭', role: 'close' }
        ]
      }
    )

    template.push(
      {
        role: 'help',
        label: '帮助',
        submenu: [
          { label: '帮助', click: openHomePage }
        ]
      }
    )

    if (isDev) {
      template.push(
        {
          label: 'Debug',
          submenu: [
            { label: '重新加载', role: 'reload' },
            { label: '清除缓存', role: 'forceReload' },
            { label: '切换 DevTools', role: 'toggleDevTools' }
          ]
        }
      )
    }

    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
  }
}

export { MenuManager }