const path = require('path')
const puppeteer = require('puppeteer')
const fsExtra = require('fs-extra')
const logger = require('./logger.js')
const runSandboxScript = require('./run-sandbox-script.js')
const merge = require('easy-pdf-merge')

const renderPdf = async ({ mainMdFilename, pathToStatic, pathToPublic, docsifyRendererPort, cover }) => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--disable-dev-shm-usage'], // Needed for Docker
    defaultViewport: { width: 1200, height: 1000 }
  })
  try {
    const mainMdFilenameWithoutExt = path.parse(mainMdFilename).name
    const docsifyUrl = `http://localhost:${docsifyRendererPort}/#/${pathToStatic}/${mainMdFilenameWithoutExt}`

    const page = await browser.newPage()
    await page.goto(docsifyUrl, { waitUntil: 'networkidle0' })
    await page.emulateMediaType('screen')

    const renderProcessingErrors = await runSandboxScript(page, {
      mainMdFilenameWithoutExt,
      pathToStatic
    })

    if (renderProcessingErrors.length) { logger.warn('anchors processing errors', renderProcessingErrors) }

    await page.pdf({
      format: 'a4',
      printBackground: true,
      landscape: false,
      headerTemplate: '<div style="display: none"></div>',
      footerTemplate: '<p style="margin: auto;text-align: center;font-size: 8px;"><span class="pageNumber"></span>&nbsp;/&nbsp;<span class="totalPages"></span></p>',
      displayHeaderFooter: true,
      path: path.resolve(pathToPublic),
      margin: { left: '1cm', right: '1cm', top: '1cm', bottom: 70 }
    })

    if (cover) {
      logger.info('rendering cover')
      if (!await fsExtra.exists(path.resolve(cover))) {
        logger.warn(`Cover image ${cover} does not exist`)
      } else {
        await new Promise((resolve, reject) => {
          merge([path.resolve(cover), path.resolve(pathToPublic)], path.resolve(pathToPublic), (err) => {
            if (err) {
              return reject(new Error(`Error merging cover and pdf: ${err}`))
            }
            logger.success('cover merged')
            resolve()
          })
        })
      }
    }

    return await browser.close()
  } catch (e) {
    await browser.close()
    throw e
  }
}

const htmlToPdf = ({ mainMdFilename, pathToStatic, pathToPublic, docsifyRendererPort, cover }) => async () => {
  const { closeProcess } = require('./utils.js')({ pathToStatic })
  try {
    return await renderPdf({
      mainMdFilename,
      pathToStatic,
      pathToPublic,
      docsifyRendererPort,
      cover
    })
  } catch (err) {
    logger.err('puppeteer renderer error:', err)
    await closeProcess(1)
  }
}

module.exports = config => ({
  htmlToPdf: htmlToPdf(config)
})
