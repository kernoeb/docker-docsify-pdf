# Docker Docsify PDF generator

This project is based on [meff34/docsify-to-pdf-converter](https://github.com/meff34/docsify-to-pdf-converter/) repository.

A lot of fixes and improvements have been made :

- Fix : 
  - Slugify / internal **URL** (some URLs were not properly encoded)
  - `localhost` links are now disabled
  - **Codeblocks** (some code blocks were sliced)
  - Better margins in the final PDF
  - Page breaks between sections
- Security/performance : 
  - Update dependencies (Puppeteer, Docsify, ...)
- Feats :
  - **Table of content** (based on sidebar)
  - Custom **cover** PDF page
  - **Docker** way to generate PDF
  - Highlight code blocks (with PrismJS)
  - **Multilingual** support
- Chore : 
  - Migration to [pnpm](https://pnpm.io/) (no more npm)
  - Clean code with standard ESLint
  - Remove useless stuff


# Usage

```
# docker build -t docsify-pdf-generator .
docker run --rm \
  --cap-add=SYS_ADMIN \
  --user $(id -u):$(id -g) \
  -v $(pwd)/.docsifytopdfrc.js:/home/node/.docsifytopdfrc.js:ro \
  -v $(pwd)/docs:/home/node/docs:ro \
  -v $(pwd)/pdf:/home/node/pdf:rw \
  docsify-pdf-generator
```
