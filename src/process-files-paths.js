const path = require('path')
const markdownLinkExtractor = require('markdown-link-extractor')
const isUrl = require('is-url')

const isGoodFile = filePath => {
  let extName = path.parse(filePath).ext
  if (!extName) return false
  extName = extName.toLowerCase()
  return extName === '.jpg' || extName === '.png' || extName === '.gif' || extName === '.jpeg' ||
      extName === '.svg' || extName === '.webp' || extName === '.bmp' || extName === '.tiff' || extName === '.ico' ||
      extName === '.puml'
}

module.exports = ({ pathToStatic }) => ({ content, name }) => {
  let markdown = content
  const dir = path.dirname(name)
  const dirWithStatic = path.resolve(process.cwd(), pathToStatic)

  markdownLinkExtractor(content)
    .filter(link => !isUrl(link))
    .filter(isGoodFile) // check if it's an image, a puml, etc.
    .map(link => ({ origin: link, processed: path.resolve(dir, link) }))
    .map(({ origin, processed }) => ({ origin, processed: path.relative(dirWithStatic, processed) }))
    .reduce((acc, curr) => {
      if (!acc.some(item => item.origin === curr.origin)) acc.push(curr)
      return acc
    }, [])
    .forEach(({ origin, processed }) => {
      markdown = markdown.replaceAll(origin, processed)
    })
  return markdown
}
