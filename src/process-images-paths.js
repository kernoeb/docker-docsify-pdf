const path = require('path')
const markdownLinkExtractor = require('markdown-link-extractor')
const isUrl = require('is-url')

const isImg = filePath => {
  let extName = path.parse(filePath).ext
  if (!extName) return false
  extName = extName.toLowerCase()
  return extName === '.jpg' || extName === '.png' || extName === '.gif' || extName === '.jpeg' ||
      extName === '.svg' || extName === '.webp' || extName === '.bmp' || extName === '.tiff' || extName === '.ico'
}

module.exports = ({ pathToStatic }) => ({ content, name }) => {
  let markdown = content
  const dir = path.dirname(name)
  const dirWithStatic = path.resolve(process.cwd(), pathToStatic)

  markdownLinkExtractor(content)
    .filter(link => !isUrl(link))
    .filter(isImg) // check if it's an image
    .map(link => ({ origin: link, processed: path.resolve(dir, link) }))
    .map(({ origin, processed }) => ({ origin, processed: path.relative(dirWithStatic, processed) }))
    .forEach(({ origin, processed }) => {
      markdown = markdown.replace(origin, processed)
    })
  return markdown
}
