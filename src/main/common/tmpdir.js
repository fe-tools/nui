import os from 'os'
import path from 'path'
import fs from 'fs-extra'

import { name } from '../../../package.json'

const tmpdir = path.resolve(os.tmpdir(), name)

const cleanTmpDir = () => {
  fs.emptyDirSync(tmpdir)
}

export { tmpdir, cleanTmpDir }
