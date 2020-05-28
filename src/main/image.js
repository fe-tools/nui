import os from 'os'
import path from 'path'
import fs from 'fs-extra'
import { name } from '../../package.json'

import { ipcMain } from 'electron'
import { IpcChannel } from './constants'

import imagemin from 'imagemin'
import imageminMozjpeg from 'imagemin-mozjpeg'

const tmpdir = path.resolve(os.tmpdir(), name)

const cleanTmpDir = () => fs.emptyDirSync(tmpdir)

const minifyImage = file => {
  return new Promise((resolve, reject) => {
    imagemin([ file ], {
      destination: tmpdir,
      plugins: [
        imageminMozjpeg({
          quality: 80
        })
      ]
    }).then(res => resolve(res[0]))
      .catch(err => reject(err))
  })
}

export const imageBootstrap = () => {
  cleanTmpDir()

  ipcMain.on(IpcChannel.FILE_ADD, async (event, file) => {
    try {
    const { destinationPath } = await minifyImage(file.path)

    const { size } = await fs.stat(destinationPath)

    event.reply(IpcChannel.FILE_DEAL, {
      name: file.name,
      path: destinationPath,
      size: size,
      type: file.type
    })
    } catch (err) {
      event.reply(IpcChannel.MAIN_ERROR, err.toString(), err.stack)
    }
  })
}
