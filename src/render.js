const path = require('node:path')
const merge = require('easy-pdf-merge')
const fsExtra = require('fs-extra')
const puppeteer = require('puppeteer')
const logger = require('./logger.js')
const runSandboxScript = require('./run-sandbox-script.js')

const SHOW_BROWSER = process.env.SHOW_BROWSER === 'true'
console.log('Show browser', SHOW_BROWSER)

async function renderPdf({ mainMdFilename, pathToStatic, pathToPublic, docsifyRendererPort, cover }) {
  const browser = await puppeteer.launch({
    headless: !SHOW_BROWSER,
    devtools: SHOW_BROWSER,
    args: [
      '--disable-dev-shm-usage',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      process.env.NO_SANDBOX ? '--no-sandbox' : '',
      ...(process.env.CHROMIUM_ARGS || '').split(' ').filter(Boolean),
    ].filter(Boolean),
    defaultViewport: { width: 1200, height: 1000 },
  })

  try {
    const mainMdFilenameWithoutExt = path.parse(mainMdFilename).name
    const docsifyUrl = `http://localhost:${docsifyRendererPort}/#/${pathToStatic}/${mainMdFilenameWithoutExt}`

    const page = await browser.newPage()

    await page.goto(docsifyUrl, { waitUntil: 'networkidle0', timeout: 560000 }) // try to wait for the page to load, especially for heavy pages
    await page.emulateMediaType('screen')

    const renderProcessingErrors = await runSandboxScript(page, {
      mainMdFilenameWithoutExt,
      pathToStatic,
    })

    logger.info(`Version : ${await page.browser().version()}`)

    if (SHOW_BROWSER) {
      // Pause 10 minutes
      await new Promise(resolve => setTimeout(resolve, 10 * 60 * 1000))
    }

    if (renderProcessingErrors.length) {
      logger.warn('anchors processing errors', renderProcessingErrors)
    }

    const pdfOptions = {
      format: 'a4',
      printBackground: true,
      landscape: false,
      headerTemplate: '<div style="display: none"></div>',
      footerTemplate: '<p style="margin: auto;text-align: center;font-size: 8px;"><span class="pageNumber"></span>&nbsp;/&nbsp;<span class="totalPages"></span></p>',
      displayHeaderFooter: true,
      path: path.resolve(pathToPublic),
      margin: { left: 29.795, right: 29.795, top: 29.795, bottom: 70 }, // 1px - 8px (padding)
      timeout: 560000, // 5 minutes
    }

    console.log(pdfOptions)

    await page.pdf(pdfOptions)
    await browser.close()

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
  } catch (e) {
    await browser.close()
    throw e
  }
}

function htmlToPdf({ mainMdFilename, pathToStatic, pathToPublic, docsifyRendererPort, cover }) {
  return async () => {
    const { closeProcess } = require('./utils.js')({ pathToStatic })
    try {
      return await renderPdf({
        mainMdFilename,
        pathToStatic,
        pathToPublic,
        docsifyRendererPort,
        cover,
      })
    } catch (err) {
      logger.err('puppeteer renderer error:', err)
      await closeProcess(1)
    }
  }
}

module.exports = config => ({
  htmlToPdf: htmlToPdf(config),
})
