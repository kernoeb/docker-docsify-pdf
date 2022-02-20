# Docker Docsify PDF generator

![Workflow](https://github.com/kernoeb/docker-docsify-pdf/actions/workflows/docker-publish.yml/badge.svg)

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

```bash
# To build locally
# docker build -t docsify-pdf-generator .
docker pull ghcr.io/kernoeb/docker-docsify-pdf:main

# Run the container
# Volumes are important

docker run --rm \
  --cap-add=SYS_ADMIN \
  --user $(id -u):$(id -g) \
  -v $(pwd)/.docsifytopdfrc.js:/home/node/.docsifytopdfrc.js:ro \
  -v $(pwd)/docs:/home/node/docs:ro \
  -v $(pwd)/pdf:/home/node/pdf:rw \
  -e "PDF_OUTPUT_NAME=DOCUMENTATION.pdf" \
  ghcr.io/kernoeb/docker-docsify-pdf:main
```

> To change `_sidebar.md` location (for example with multi-language support) :  
> Add `-v $(pwd)/docs/de/_sidebar.md:/home/node/docs/_sidebar.md:ro` to the command

* Tip : you can run `zx README.md` to generate the PDF if you have [zx](https://github.com/google/zx)

> You can also customize the PDF css by adding a volume mapped to the `resources` directory.


# Screenshots

![Screenshot 1](img/capture1.png)

![Screenshot 2](img/capture2.png)

![Screenshot 3](img/capture3.png)
