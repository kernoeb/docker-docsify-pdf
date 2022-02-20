const path = require('path')
const { merge } = require('lodash')
const logger = require('./logger.js')

const defaultConfig = {
  pathToStatic: '.static',
  mainMdFilename: 'main.md',
  pathToPublic: process.env.PDF_OUTPUT_NAME ? path.join('./pdf/', process.env.PDF_OUTPUT_NAME) : './pdf/DOC.pdf',
  contents: 'docs/_sidebar.md',
  pathToDocsifyEntryPoint: '.',
  cover: 'resources/cover.pdf'
}

const run = async () => {
  const docsifyRendererPort = 17000
  const docsifyLiveReloadPort = 18000

  logger.info('Build with settings:')
  console.log(defaultConfig)
  console.log('\n')

  const config = merge(defaultConfig, { docsifyRendererPort, docsifyLiveReloadPort })

  const { closeProcess, prepareEnv, cleanUp } = require('./utils.js')(config)
  const { createRoadMap } = require('./contents-builder.js')(config)
  const { combineMarkdowns } = require('./markdown-combine.js')(config)
  const { runDocsifyRenderer } = require('./docsify-server.js')(config)
  const { htmlToPdf } = require('./render.js')(config)

  try {
    await cleanUp()

    await prepareEnv()
    const roadMap = await createRoadMap()
    await combineMarkdowns(roadMap)

    runDocsifyRenderer()
    await htmlToPdf()

    logger.success(path.resolve(config.pathToPublic))
  } catch (error) {
    logger.err('run error', error)
  } finally {
    await closeProcess(0)
  }
}

module.exports = run
