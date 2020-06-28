import path from 'path'
import fs from 'fs-extra'
import { ipcMain, dialog } from 'electron'

import { IpcChannel } from './constants'
import { getFileMD5 } from '../common/file'
import { MenuManager } from '../common/menu'
import { setOSSClient, putImageToOss } from '../common/ali-oss'
import { content as configs, writeRcfile } from '../common/rcfile'

import { minifyImage } from './utils'

const IMAGE_CONFIG = 'imageConfigs'

export const imageBootstrap = win => {
  // init menu
  const menu = new MenuManager()
  menu.on('setting', () => {
    win.webContents.send(IpcChannel.SETTING_SHOW)
  })

  ipcMain.on(IpcChannel.VIEW_READY, (event) => {
    event.reply(IpcChannel.ON_CONFIGS_MODIFY, configs)
  })

  // handle image compression
  ipcMain.on(IpcChannel.FILE_ADD, async (event, file) => {
    try {
      const { data, outpath } = await minifyImage(file)

      const hash = getFileMD5(data)
      const ext = path.extname(outpath)
      const { size } = await fs.stat(outpath)

      event.reply(IpcChannel.FILE_DEAL, {
        name: file.name,
        path: outpath,
        size: size,
        type: file.type,
        hash: hash,
        ext: ext
      })
    } catch (err) {
      event.reply(IpcChannel.MAIN_ERROR, err.toString(), err.stack)
    }
  })

  // set ali-oss options
  if (configs.imageConfigs) setOSSClient(configs.imageConfigs)
  ipcMain.on(IpcChannel.CONFIGS_MODIFY, (event, data) => {
    writeRcfile({ [IMAGE_CONFIG]: data })

    try {
      setOSSClient(data)
    } catch(err) {
      event.reply(IpcChannel.MAIN_ERROR, err.toString(), err.stack)
    }

    event.reply(IpcChannel.ON_CONFIGS_MODIFY, configs)
  })

  // upload image to CDN
  ipcMain.on(IpcChannel.FILE_PUT, (event, file) => {
    try {
      putImageToOss(file)
        .then(res => event.reply(IpcChannel.FILE_PUT_RESULT, res.url))
        .catch(err=> event.reply(IpcChannel.FILE_PUT_RESULT, '', err))
    } catch (err) {
      event.reply(IpcChannel.MAIN_ERROR, err.toString(), err.stack)
    }
  })

  // handle image save
  ipcMain.on(IpcChannel.FILE_SAVE, async (event, source, target) => {
    try {
      const { filePath } = await dialog.showSaveDialog(win, {
        title: '保存文件',
        defaultPath: source.path,
        filters: [{
          name: source.name,
          extensions: [ target.ext ],
        }]
      })

      fs.copy(target.path, filePath)
    } catch (err) {
      event.reply(IpcChannel.MAIN_ERROR, err.toString(), err.stack)
    }
  })
}
