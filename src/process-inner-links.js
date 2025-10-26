const path = require('path')
const url = require('url')
const markdownLinkExtractor = require('markdown-link-extractor')
const unified = require('unified')
const parser = require('remark-parse')
const slug = require('./slugify')

const recursiveGetValueInChildren = (children, array) => {
  children.forEach(child => {
    if (child.children) {
      recursiveGetValueInChildren(child.children, array)
    } else {
      array.push(child.value)
    }
  })
}

const cleanText = (string) => {
  const entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
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
      const resolvedPath = path.resolve(path.dirname(name), linkPath)
      const docsPath = arr.find(({ name }) => name.endsWith('docs/README.md'))
      const docsDir = docsPath ? path.dirname(docsPath.name) : ''

      return {
        file: arr.find(({ name: fileName }) => {
          if (fileName === resolvedPath) return true
          if (fileName === `${resolvedPath}.md`) return true

          if (docsDir) {
            const resolvedFromDocs = path.resolve(docsDir, linkPath)
            if (fileName === resolvedFromDocs) return true
            if (fileName === `${resolvedFromDocs}.md`) return true
          }
          return false
        }),
        link: href,
        anchor
      }
    })
    .filter(({ file }) => file)
    .map(({ file: { content }, link, anchor }) => ({
      ast: unified().use(parser)
        .parse(content),
      link,
      anchor
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
        console.error('no heading (non blocking error)', link)
        return { link, unsafeTag: '' }
      }

      const array = []
      recursiveGetValueInChildren(headingNode.children, array)
      const value = cleanText(array.join(' ')).trim()

      return { link, unsafeTag: value }
    })
    .map(({ unsafeTag, link }) => ({
      link,
      tagWord: slug(unsafeTag)
    }))
    .map(({ link, tagWord }) => ({
      link,
      tag: `#${tagWord}`
    }))

  b.forEach(({ tag, link }) => {
    const escapedLink = link.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    newContent = newContent.replace(new RegExp('\\[(.*)\\]\\(' + escapedLink + '\\)'), `[$1](${tag})`)
  })

  return { content: newContent, name }
}
