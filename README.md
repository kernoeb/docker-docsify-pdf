# Docker Docsify PDF generator

This project is based on [meff34/docsify-to-pdf-converter](https://github.com/meff34/docsify-to-pdf-converter/) repository.

A lot of fixes and improvements have been made :

- Fix : 
  - Slugify / internal **URL** (some URLs were not properly encoded)
  - "localhost" links are now disabled
  - **Codeblocks** (some code blocks were sliced)
  - Better margins in the final PDF
- Security/performance : 
  - Update dependencies (Puppeteer, Docsify, ...)
- Feats :
  - **Table of content** (based on sidebar)
  - **Docker** way to generate PDF
  - Highlight code blocks (with PrismJS)
  - **Multilingual** support
- Chore : 
  - Migration to pnpm (no more npm)
  - Clean code with standard ESLint
  - Remove useless stuff
