const path = require('path')
const resolve = dir => path.join(__dirname, './', dir)

module.exports = {
  lintOnSave: false,
  configureWebpack: config => {
    config.entry.app = path.join(__dirname, 'src/renderer/main.js')
  },
  chainWebpack: config => {
    config.resolve.alias
      .set('@', resolve('src/renderer/main/'))
  },
  pluginOptions: {
    electronBuilder: {
      mainProcessFile: 'src/main/index.js',
      builderOptions: {
        asar: false
      }
    }
  }
}
