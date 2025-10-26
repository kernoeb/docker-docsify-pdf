const path = require('node:path')
const url = require('node:url')
const markdownLinkExtractor = require('markdown-link-extractor')
const parser = require('remark-parse')
const unified = require('unified')
const slug = require('./slugify')

function recursiveGetValueInChildren(children, array) {
  children.forEach((child) => {
    if (child.children) {
      recursiveGetValueInChildren(child.children, array)
    } else {
      array.push(child.value)
    }
  })
}

function cleanText(string) {
  const entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    '\'': '&#39;',
  }

  return String(string).replace(/[&<>"']/g, s => entityMap[s])
}

module.exports = ({ content, name }, _, arr) => {
  let newContent = content
  const b = markdownLinkExtractor(content, true)
    .filter(({ title }) => !title || !title.startsWith(':include'))
    .map(({ href }) => ({ href, parsed: url.parse(href) }))
    .filter(({ parsed }) => {
      const ext = path.parse(parsed.pathname).ext
      return ext === '' || ext === '.md'
    })
    .map(({ href, parsed }) => {
      const linkPath = parsed.pathname
      let anchor = parsed.hash ? parsed.hash.substring(1) : null
      if (!anchor && parsed.query) {
        const params = new URLSearchParams(parsed.query)
        if (params.has('id')) {
          anchor = params.get('id')
        }
      }

      const docsPath = arr.find(({ name }) => name.endsWith('docs/README.md'))
      const docsDir = docsPath ? path.dirname(docsPath.name) : ''

      let file

      const findFile = (basePath) => {
        return arr.find(({ name: fileName }) => {
          const absoluteFileName = path.resolve(process.cwd(), fileName)
          if (absoluteFileName === basePath) return true
          if (absoluteFileName === `${basePath}.md`) return true
          if (absoluteFileName === path.join(basePath, 'README.md')) return true
          return false
        })
      }

      if (linkPath.startsWith('/')) {
        const absolutePath = path.join(docsDir, linkPath)
        file = findFile(absolutePath)
      } else {
        // First, try to resolve the path relative to the current file's directory.
        const resolvedPath = path.resolve(path.dirname(name), linkPath)
        file = findFile(resolvedPath)

        // If the file is not found, try to resolve it relative to the docs root directory as a fallback.
        if (!file && docsDir) {
          const resolvedFromDocs = path.resolve(docsDir, linkPath)
          file = findFile(resolvedFromDocs)
        }
      }

      return {
        file,
        link: href,
        anchor,
      }
    })
    .filter(({ file }) => file)
    .map(({ file: { content }, link, anchor }) => ({
      ast: unified().use(parser).parse(content),
      link,
      anchor,
    }))
    .map(({ ast, link, anchor }) => {
      let headingNode
      const headings = ast.children.filter(({ type }) => type === 'heading')

      if (anchor) {
        for (const heading of headings) {
          const array = []
          recursiveGetValueInChildren(heading.children, array)
          const value = cleanText(array.join(' ')).trim()
          if (slug(value) === anchor) {
            headingNode = heading
            break
          }
        }
      } else {
        [headingNode] = headings
      }

      if (!headingNode) {
        console.warn(`no heading found for ${link}. The link will point to the top of the page.`)
        return { link, unsafeTag: '' }
      }

      const array = []
      recursiveGetValueInChildren(headingNode.children, array)
      const value = cleanText(array.join(' ')).trim()

      return { link, unsafeTag: value }
    })
    .map(({ unsafeTag, link }) => ({
      link,
      tagWord: slug(unsafeTag),
    }))
    .map(({ link, tagWord }) => ({
      link,
      tag: `#${tagWord}`,
    }))

  b.forEach(({ tag, link }) => {
    const escapedLink = link.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    newContent = newContent.replace(new RegExp(`\\[(.*)\\]\\(${escapedLink}\\)`), `[$1](${tag})`)
  })

  return { content: newContent, name }
}
