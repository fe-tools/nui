import os from 'os'
import path from 'path'
import { execFile } from 'child_process'
import fs from 'fs-extra'
import { app } from 'electron'

/**
 * https://github.com/meowtec/Imagine/blob/master/modules/optimizers/bin.ts
 */

const platformAlias = {
  darwin: 'mac',
  win32: 'win',
}

const platform = os.platform()
const targetDir = platformAlias[platform] || platform

const basePath = path.resolve(__static, 'vendor', targetDir)
                     .replace('app.asar', 'app.asar.unpacked')

const getBin = (name) => {
  if (platform === 'win32') {
    name = name + '.exe'
  }

  return path.resolve(
    basePath,
    name,
  )
}

export const pngquant = getBin('pngquant')
export const mozjpeg = getBin('moz-cjpeg')

export const execProcessor = (processor, args, inputBuffer, outputPath) => {
  return new Promise((resolve, reject) => {
    const cp = execFile(processor, args, {
      encoding: null,
      maxBuffer: Infinity,
    }, async (err, stdout) => {
      if (err) return reject(err)
      if (outputPath) {
        await fs.writeFile(outputPath, stdout)
        resolve({
          data: stdout,
          destinationPath: outputPath
        })
      } else {
        resolve(stdout)
      }
    })

    if (inputBuffer) {
      cp.stdin.end(inputBuffer)
    }
  })
}