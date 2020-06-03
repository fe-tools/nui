import os from 'os'
import path from 'path'
import fs from 'fs-extra'
import crypto from 'crypto'

import { name, version } from '../../package.json'

import { app, ipcMain, dialog, Menu, shell } from 'electron'
import { IpcChannel } from './constants'

import imagemin from 'imagemin'
import imageminMozjpeg from 'imagemin-mozjpeg'

import { OSSClient, setOSSClient } from './ali-oss'

const configs = {}

const tmpdir = path.resolve(os.tmpdir(), name)
const rcpath = path.resolve(os.homedir(), `.${name}rc`)

const readRcfile = (path) => {
  if (fs.existsSync(path)) {
    Object.assign(configs, fs.readJSONSync(path))
  } else {
    fs.writeJSONSync(path, {
      name: name,
      version: version
    }, { spaces: 2 })
  }
}

const writeRcfile = (path, data) => {
  if (fs.existsSync(path)) {
    fs.writeJSONSync(path, data, { spaces: 2 })
  }
}

const cleanTmpDir = () => fs.emptyDirSync(tmpdir)

const initMenu = (win) => {
  const isMac = process.platform === 'darwin'
  const template = [
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { label: '关于', role: 'about' },
        { type: 'separator' },
        { label: '设置', click: () => showSetting(win)},
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

const showSetting = (win) => {
  win.webContents.send(IpcChannel.SETTING_SHOW)
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

  readRcfile(rcpath)

  cleanTmpDir()

  initMenu(win)

  if (configs.imageConfigs) {
    setOSSClient(configs.imageConfigs)
  }

  ipcMain.on(IpcChannel.VIEW_READY, (event) => {
    event.reply(IpcChannel.ON_CONFIGS_MODIFY, configs)
  })

  ipcMain.on(IpcChannel.CONFIGS_MODIFY, (event, data) => {
    Object.assign(configs, { imageConfigs: data })
    writeRcfile(rcpath, configs)
    try {
      setOSSClient(data)
    } catch(err) {
      console.log('=====', err)
    }
    event.reply(IpcChannel.ON_CONFIGS_MODIFY, configs)
  })

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
