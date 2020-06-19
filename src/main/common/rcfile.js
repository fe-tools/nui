import os from 'os'
import path from 'path'
import fs from 'fs-extra'

import { name, version } from '../../../package.json'

const FILE_NAME = `.${name}rc`

const content = {}

const rcPath = path.resolve(os.homedir(), FILE_NAME)

// TODO: check .rc JSON Schema
const initContent = {
  name: name,
  version: version
}

const initRcFile = () => {
  fs.writeJSONSync(path, initContent, { spaces: 2 })
}

const readRcFile = () => {
  if (fs.existsSync(rcPath)) {
    return fs.readJSONSync(rcPath)
  } else {
    initRcFile()
    return initConfig
  }
}

const writeRcfile = (config) => {
  if (!fs.existsSync(rcPath)) {
    initRcFile()
  }
  // overwrite content
  fs.writeJSONSync(rcPath, Object.assign(content, config), { spaces: 2 })
}

Object.assign(content, readRcFile())

export {
  content,
  rcPath,
  readRcFile,
  writeRcfile
}
