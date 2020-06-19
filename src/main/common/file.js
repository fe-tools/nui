import fs from 'fs-extra'
import crypto from 'crypto'
import fileType from 'file-type'

const getFileMD5 = (file) => {
  let blob

  if (Buffer.isBuffer(file)) {
    blob = file
  } else {
    blob = fs.readFileSync(file)
  }

  const hash = crypto.createHash('md5')
  const md5 = hash.update(blob).digest('hex')

  return md5
}

const getFileMime = async (path) => {
  const { mime } = await fileType.fromFile(path)
  return mime
}

export { getFileMD5, getFileMime }
