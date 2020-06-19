import path from 'path'
import { platform } from './env'

/**
 * https://github.com/meowtec/Imagine/blob/master/modules/optimizers/bin.ts
 */

const platformAlias = {
  darwin: 'mac',
  win32: 'win'
}

const vendorPath = path.resolve(__static, 'vendor', platformAlias[platform] || platform)
                       .replace('app.asar', 'app.asar.unpacked')

export { vendorPath }
