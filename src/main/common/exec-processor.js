import fs from 'fs-extra'
import { execFile } from 'child_process'

const execProcessor = (processor, args, input, output) => {
  return new Promise((resolve, reject) => {
    const childProcess = execFile(
      processor,
      args,
      { encoding: null, maxBuffer: Infinity },
      async (err, stdout, stderr) => {
        if (err) return reject(err)
        if (!output) return resolve(stdout)

        await fs.writeFile(output, stdout)

        resolve(stdout)
      }
    )

    if (input) childProcess.stdin.end(input)
  })
}

export { execProcessor }
