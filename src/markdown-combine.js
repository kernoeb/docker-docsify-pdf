const fs = require('fs').promises
const fsExtra = require('fs-extra')
const path = require('path')
const logger = require('./logger.js')
const processImagesPaths = require('./process-images-paths.js')
const processInnerLinks = require('./process-inner-links.js')

const combineMarkdowns = ({ contents, pathToStatic, mainMdFilename }) => async links => {
  try {
    const files = await Promise.all(
      await links.map(async filename => {
        const fileExist = await fsExtra.exists(filename)

        if (fileExist) {
          const content = await fs.readFile(filename, { encoding: 'utf8' })
          return { content, name: filename }
        }

        throw new Error(`file ${filename} is not exist, but listed in ${contents}`)
      })
    )

    const resultFilePath = path.resolve(pathToStatic, mainMdFilename)

    try {
      const content = files
        .map(processInnerLinks)
        .map(processImagesPaths({ pathToStatic }))
        .join('\n\n\n\n<div style="page-break-after:always;"></div>\n\n\n\n')
      await fs.writeFile(resultFilePath, content)
    } catch (e) {
      logger.err('markdown combining error', e)
      throw e
    }

    return resultFilePath
  } catch (err) {
    logger.err('combineMarkdowns', err)
    throw err
  }
}

module.exports = config => ({
  combineMarkdowns: combineMarkdowns(config)
})
