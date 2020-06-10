import { execFile } from 'child_process'
import fs from 'fs-extra'

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