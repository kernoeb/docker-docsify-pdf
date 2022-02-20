const fs = require('fs').promises
const fsExtra = require('fs-extra')
const path = require('path')
const logger = require('./logger.js')
const processImagesPaths = require('./process-images-paths.js')
const processInnerLinks = require('./process-inner-links.js')
const { EOL: endOfLine } = require('os')

const combineMarkdowns = ({ contents, pathToStatic, mainMdFilename }) => async links => {
  try {
    let files = await Promise.all(
      links.map(async filename => {
        const fileExist = await fsExtra.exists(filename)

        if (fileExist) {
          const content = await fs.readFile(filename, { encoding: 'utf8' })
          return { content, name: filename }
        }

        throw new Error(`file ${filename} is not exist, but listed in ${contents}`)
      })
    )

    const resultFilePath = path.resolve(pathToStatic, mainMdFilename)
    const sidebar = await Promise.all(contents.map(async doc => fs.readFile(doc, { encoding: 'utf8' })))

    files = [
      {
        content: '# Table of contents' + endOfLine + endOfLine + sidebar,
        name: 'table-of-contents.md'
      },
      ...files
    ]

    try {
      const content = files
        .map(processInnerLinks)
        .map(processImagesPaths({ pathToStatic }))
        .join('\n\n\n\n<div style="page-break-after:always;"></div>\n\n\n\n') // Page breaks
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
