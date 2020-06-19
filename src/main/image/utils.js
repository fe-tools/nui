import path from 'path'
import fs from 'fs-extra'

import { tmpdir } from '../common/tmpdir'
import { platform } from '../common/env'
import { getFileMime } from '../common/file'
import { vendorPath } from '../common/vendor-path'
import { execProcessor } from '../common/exec-processor'

const getLib = name => {
  return path.resolve(vendorPath, platform === 'win32'
    ? `${name}.exe`
    : name
  )
}

const minifyImage = async file => {
  try {
    let resolveBlob = null
    let outpath = null

    const mime = await getFileMime(file.path)
    const blob = await fs.readFile(file.path)

    switch (mime) {
      case 'image/jpeg':
        outpath = path.resolve(tmpdir, file.name)
        resolveBlob = await execProcessor(getLib('moz-cjpeg'), ['-quality', 85], blob, outpath)
        break
      case 'image/png':
        outpath = path.resolve(tmpdir, file.name)
        resolveBlob = await execProcessor(getLib('pngquant'), ['-', '--quality', '60-80'], blob, outpath)
        break
      default:
        outpath = file.path
        resolveBlob = blob
    }

    return Promise.resolve({ data: resolveBlob, outpath: outpath })
  } catch (err) {
    return Promise.reject(err)
  }
}

export { minifyImage }