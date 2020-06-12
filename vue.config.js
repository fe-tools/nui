const path = require('path')
const glob = require('glob')
const PermissionsOutputPlugin = require('webpack-permissions-plugin')

const resolve = dir => path.join(__dirname, './', dir)

module.exports = {
  lintOnSave: false,
  configureWebpack: config => {
    config.entry.app = path.join(__dirname, 'src/renderer/main.js')
  },
  chainWebpack: config => {
    config.plugin('file-permissions')
      .use(PermissionsOutputPlugin, [{
        buildFiles: glob.sync(path.resolve(__dirname, 'dist/vendor/**/*'))
      }])

    config.resolve.alias
      .set('@', resolve('src/renderer/main/'))
  },
  pluginOptions: {
    electronBuilder: {
      mainProcessFile: 'src/main/index.js',
      builderOptions: {
        asar: true,
        asarUnpack: [
          'vendor' 
        ]
      },
      chainWebpackMainProcess: config => {
        config.plugin('file-permissions')
          .use(PermissionsOutputPlugin, [{
            buildFiles: glob.sync(path.resolve(__dirname, 'dist_electron/bundled/vendor/**/*'))
          }])
      }
    }
  }
}
