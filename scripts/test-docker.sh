#!/usr/bin/env bash

docker build -t "test-docsify-pdf" . || exit 1
mkdir -p "$(pwd)/pdf" || exit 1

docker run --rm -it \
  --cap-add=SYS_ADMIN \
  --user "$(id -u):$(id -g)" \
  -v "$(pwd)/docs:/home/node/docs:ro" \
  -v "$(pwd)/pdf:/home/node/pdf:rw" \
  -v "$(pwd)/resources/covers/cover.pdf:/home/node/resources/cover.pdf:ro" \
  -e "PDF_OUTPUT_NAME=TEST-DOCUMENTATION.pdf" \
  test-docsify-pdf
