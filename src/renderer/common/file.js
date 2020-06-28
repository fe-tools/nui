/**
 * https://gist.github.com/lanqy/5193417
 */
export const formateFileSize = bytes => {
  if (bytes === 0) return 'n/a'
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1000)), 10)
  if (i === 0) return `${bytes} ${sizes[i]}`
  return `${(bytes / (1000 ** i)).toFixed(1)} ${sizes[i]}`
}
