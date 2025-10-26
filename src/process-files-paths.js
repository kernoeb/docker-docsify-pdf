const path = require('node:path')
const isUrl = require('is-url')
const jsdom = require('jsdom')
const markdownLinkExtractor = require('markdown-link-extractor')
const parser = require('remark-parse')
const unified = require('unified')

function isGoodFile(filePath, title) {
  if (title) return true

  let extName = path.parse(filePath).ext
  if (!extName) return false
  extName = extName.toLowerCase()

  return extName === '.jpg' || extName === '.png' || extName === '.gif' || extName === '.jpeg'
    || extName === '.svg' || extName === '.webp' || extName === '.bmp' || extName === '.tiff' || extName === '.ico'
    || extName === '.puml'
}

module.exports = ({ pathToStatic }) => ({ content, name }) => {
  let markdown = content
  const dir = path.dirname(name)
  const dirWithStatic = path.resolve(process.cwd(), pathToStatic)

  // match all [[!include .*]]
  let includeMatches = []
  const includeRegex = /\[\[!include\s+(.*)\]\]/g
  const tmpMatches = markdown.match(includeRegex)
  if (tmpMatches?.length) {
    includeMatches = tmpMatches
      .map(v => v.trim())
      .filter(Boolean)
      .map(match => match.replace('[[!include ', '').replace(']]', '').trim())
      .filter(Boolean)
  }

  let images = []
  try {
    const dom = new jsdom.JSDOM(content)
    const document = dom.window.document
    images = [...document.querySelectorAll('img')].map(img => img.getAttribute('src')).filter(Boolean)
  } catch (err) {
    console.log(err)
  }

  const isImage = v => v && (v.type === 'image' || (v.type === 'html' && v.value.includes('<img')))

  markdownLinkExtractor(content, true).concat(includeMatches.map(href => ({ href }))).concat(images.map(href => ({ href }))).filter(({ href }) => !isUrl(href)).filter(({ href, title }) => isGoodFile(href, title)).map(item => ({ origin: item.href, processed: path.resolve(dir, item.href), item })).map(({ origin, processed, item }) => ({ origin, processed: path.relative(dirWithStatic, processed), item })).reduce((acc, curr) => {
    if (!acc.some(item => item.origin === curr.origin)) acc.push(curr)
    return acc
  }, []).forEach(({ origin, processed, item }) => {
    if (origin.trim().endsWith('.puml')) {
      markdown = markdown.replaceAll(origin, processed)
      return
    }

    let lineNumber = 1
    for (const line of markdown.split('\n')) {
      if (line.includes(origin)) {
        let filtered = []
        const a = unified().use(parser).parse(markdown)?.children || []
        filtered = a.filter(isImage)
        const b = a.map(v => v.children).flat()
        filtered = filtered.concat(b.filter(isImage)).flat().filter(Boolean)

        const allPositions = filtered.map(v => ({
          start: v.position.start.offset,
          end: v.position.end.offset,
          lineStart: v.position.start.line,
          lineEnd: v.position.end.line,
        }))

        markdown = markdown.replaceAll(origin, (match, offset) => {
          const currentLineByOffset = markdown.substring(0, offset).split('\n').length
          if (currentLineByOffset !== lineNumber) return match

          const start = offset
          const end = start + match.length

          const isBetweenPosition = allPositions.some((position) => {
            if (position.lineStart === position.lineEnd) return start >= position.start && end <= position.end && lineNumber === position.lineStart
            else return lineNumber >= position.lineStart && lineNumber <= position.lineEnd
          })

          if (item.title && item.title.startsWith(':include')) return processed
          return isBetweenPosition ? processed : match
        })
      }
      lineNumber++
    }
  })

  return markdown
}
