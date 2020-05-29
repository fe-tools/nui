import os from 'os'
import path from 'path'
import fs from 'fs-extra'
import crypto from 'crypto'

import { name } from '../../package.json'

import { ipcMain } from 'electron'
import { IpcChannel } from './constants'

import imagemin from 'imagemin'
import imageminMozjpeg from 'imagemin-mozjpeg'

import { OSSClient } from './ali-oss'

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

const putImageToOss = file => {
  return OSSClient.put(file.hash + file.ext, file.path)
}

export const imageBootstrap = () => {
  cleanTmpDir()

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
}
