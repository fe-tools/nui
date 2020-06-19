import path from 'path'
import { app, protocol, BrowserWindow } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'

import { isDev } from './common/env'
import { cleanTmpDir } from './common/tmpdir'
import { imageBootstrap } from './image'

let win

protocol.registerSchemesAsPrivileged([
  {scheme: 'app', privileges: { secure: true, standard: true } }
])

function createWindow () {
  win = new BrowserWindow({
    width: isDev? 675: 375,
    height: 667,
    icon: path.join(__static, 'icon.png'),
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    webPreferences: {
      nodeIntegration: true,
      webSecurity: false
    }
  })

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    win.loadURL('app://./index.html')
  }

  win.on('closed', () => {
    win = null
  })
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (win === null) {
    createWindow()
  }
})

app.on('ready', async () => {
  createWindow()
  cleanTmpDir()
  imageBootstrap(win)
})

if (isDev) {
  if (process.platform === 'win32') {
    process.on('message', data => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}