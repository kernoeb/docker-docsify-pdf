const path = require('path')
const markdownLinkExtractor = require('markdown-link-extractor')
const isUrl = require('is-url')
const jsdom = require('jsdom')
const unified = require('unified')
const parser = require('remark-parse')

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

  // match all [[!include .*]]
  let includeMatches = []
  const includeRegex = /\[\[!include\s+(.*)]]/gm
  const tmpMatches = markdown.match(includeRegex)
  if (tmpMatches?.length) {
    includeMatches = tmpMatches
      .map(v => v.trim()).filter(Boolean)
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

  markdownLinkExtractor(content).concat(includeMatches).concat(images)
    .filter(link => !isUrl(link))
    .filter(isGoodFile) // check if it's an image, a puml, etc.
    .map(link => ({ origin: link, processed: path.resolve(dir, link) }))
    .map(({ origin, processed }) => ({ origin, processed: path.relative(dirWithStatic, processed) }))
    .reduce((acc, curr) => {
      if (!acc.some(item => item.origin === curr.origin)) acc.push(curr)
      return acc
    }, [])
    .forEach(({ origin, processed }) => {
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
            lineEnd: v.position.end.line
          }))

          markdown = markdown.replaceAll(origin, (match, offset) => {
            const currentLineByOffset = markdown.substring(0, offset).split('\n').length
            if (currentLineByOffset !== lineNumber) return match

            const start = offset
            const end = start + match.length

            const isBetweenPosition = allPositions.some(position => {
              if (position.lineStart === position.lineEnd) return start >= position.start && end <= position.end && lineNumber === position.lineStart
              else return lineNumber >= position.lineStart && lineNumber <= position.lineEnd
            })

            if (isBetweenPosition) return processed
            return match
          })
        }
        lineNumber++
      }
    })
  return markdown
}
