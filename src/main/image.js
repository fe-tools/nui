import os from 'os'
import path from 'path'
import fs from 'fs-extra'
import crypto from 'crypto'

import { name } from '../../package.json'

import { app, ipcMain, dialog, Menu, shell } from 'electron'
import { IpcChannel } from './constants'

import imagemin from 'imagemin'
import imageminMozjpeg from 'imagemin-mozjpeg'

import { OSSClient } from './ali-oss'

const tmpdir = path.resolve(os.tmpdir(), name)

const cleanTmpDir = () => fs.emptyDirSync(tmpdir)

const initMenu = () => {
  const isMac = process.platform === 'darwin'
  const template = [
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { label: '关于', role: 'about' },
        { type: 'separator' },
        { label: '服务', role: 'services' },
        { type: 'separator' },
        { label: '隐藏', role: 'hide' },
        { label: '隐藏其他应用', role: 'hideothers' },
        { label: '显示全部', role: 'unhide' },
        { type: 'separator' },
        { label: '退出', role: 'quit' }
      ]
    }] : []),
    {
      label: '窗口',
      submenu: [
        { label: '最小化', role: 'minimize' },
        { label: '缩放', role: 'zoom' },
        ...(isMac ? [
          { type: 'separator' },
          { label: '前置所有窗口', role: 'front' },
        ] : [
          { role: 'close' }
        ])
      ]
    },
    {
      role: 'help',
      label: '帮助',
      submenu: [
        {
          label: '帮助',
          click: async () => await shell.openExternal('https://electronjs.org')
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

const minifyImage = file => {
  return new Promise((resolve, reject) => {
    imagemin([ file ], {
      destination: tmpdir,
      plugins: [
        imageminMozjpeg({
          quality: 85
        })
      ]
    }).then(res => resolve(res[0]))
      .catch(err => reject(err))
  })
}

const putImageToOss = file => {
  return OSSClient.put(file.hash + file.ext, file.path)
}

const saveImage = (win, currentFile, tinyFile) => {
  return dialog.showSaveDialog(win, {
    title: '保存文件',
    defaultPath: currentFile.path,
    filters: [{
      name: currentFile.name,
      extensions: [ tinyFile.ext ],
    }]
  })
}

export const imageBootstrap = (win) => {
  cleanTmpDir()

  initMenu()

  ipcMain.on(IpcChannel.FILE_ADD, async (event, file) => {
    try {
      const { data, destinationPath } = await minifyImage(file.path)

      const md5 = crypto.createHash('md5')
      const hash = md5.update(data).digest('hex')
      const ext = path.extname(destinationPath)
      const { size } = await fs.stat(destinationPath)

      event.reply(IpcChannel.FILE_DEAL, {
        name: file.name,
        path: destinationPath,
        size: size,
        type: file.type,
        hash: hash,
        ext: ext
      })
    } catch (err) {
      event.reply(IpcChannel.MAIN_ERROR, err.toString(), err.stack)
    }
  })

  ipcMain.on(IpcChannel.FILE_PUT, (event, file) => {
    try {
      putImageToOss(file)
        .then(res => event.reply(IpcChannel.FILE_PUT_SUCCESS, res.url))
        .catch(err=> event.reply(IpcChannel.FILE_PUT_ERROR, err))
    } catch (err) {
      event.reply(IpcChannel.MAIN_ERROR, err.toString(), err.stack)
    }
  })

  ipcMain.on(IpcChannel.FILE_SAVE, async (event, currentFile, tinyFile) => {
    try {
      const { filePath } = await saveImage(win, currentFile, tinyFile)
      fs.copy(tinyFile.path, filePath)
    } catch (err) {
      event.reply(IpcChannel.MAIN_ERROR, err.toString(), err.stack)
    }
  })
}
