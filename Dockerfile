FROM node:22.21.0-alpine3.22

RUN apk add --no-cache curl bash bash-completion chromium nss freetype harfbuzz ca-certificates openjdk11
RUN echo @edge https://nl.alpinelinux.org/alpine/edge/testing >> /etc/apk/repositories && apk add --no-cache icu-data-full wqy-zenhei@edge
RUN apk add font-noto-emoji

RUN USER=node && \
    GROUP=node && \
    curl -SsL https://github.com/boxboat/fixuid/releases/download/v0.6.0/fixuid-0.6.0-linux-amd64.tar.gz | tar -C /usr/local/bin -xzf - && \
    chown root:root /usr/local/bin/fixuid && \
    chmod 4755 /usr/local/bin/fixuid && \
    mkdir -p /etc/fixuid && \
    printf "user: $USER\ngroup: $GROUP\npaths:\n  - /home/node/pdf\n  - /home/node/.static\n  - /home/node/resources" > /etc/fixuid/config.yml

WORKDIR /home/node
RUN mkdir -p /home/node/.static/ && chown -R node:node /home/node/.static/

USER node:node

ENV NODE_ENV production

# Tell Puppeteer to skip installing Chrome. We'll be using the installed package.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

ENV XDG_CONFIG_HOME=/tmp/.chromium
ENV XDG_CACHE_HOME=/tmp/.chromium

COPY --chown=node:node package.json package-lock.json ./

RUN chown -R node:node /home/node

RUN npm ci --omit=dev

COPY --chown=node:node index.html index.js index.html ./
COPY --chown=node:node resources/js/ ./resources/js/
COPY --chown=node:node resources/css/ ./resources/css/
COPY --chown=node:node src/ ./src/

EXPOSE 3000

# make sure that the user is node:node
ENTRYPOINT ["fixuid"]
CMD [ "node", "index.js" ]
