import os from 'os'

export const platform = os.platform()

export const isMac = platform === 'darwin'

export const isDev = process.env.NODE_ENV !== 'production'