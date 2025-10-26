const path = require('node:path')
const fsExtra = require('fs-extra')
require('colors')

const logger = require('./logger.js')

const removeArtifacts = async paths => Promise.all(paths.map(path => new Promise(resolve => fsExtra.remove(path, resolve))))

function prepareEnv({ pathToStatic, pathToPublic }) {
  return () => {
    const pathToStaticDir = path.resolve(pathToStatic)
    const pathToPublicDir = path.dirname(path.resolve(pathToPublic))

    return Promise.all([fsExtra.mkdirp(pathToStaticDir), fsExtra.mkdirp(pathToPublicDir)]).catch((err) => {
      logger.err('prepareEnv', err)
    })
  }
}

function cleanUp({ pathToStatic, pathToPublic }) {
  return async () => {
    const isExist = await fsExtra.exists(path.resolve(pathToStatic))

    if (!isExist) {
      return Promise.resolve()
    }

    return removeArtifacts([path.resolve(pathToPublic)])
  }
}

function closeProcess({ pathToStatic }) {
  return async (code) => {
    await removeArtifacts([path.resolve(pathToStatic)])

    return process.exit(code)
  }
}

module.exports = config => ({
  prepareEnv: prepareEnv(config),
  cleanUp: cleanUp(config),
  closeProcess: closeProcess(config),
})
