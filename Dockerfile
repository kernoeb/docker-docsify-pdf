FROM node:16.14.0-alpine3.15

RUN apk add --no-cache curl bash bash-completion chromium nss freetype harfbuzz ca-certificates openjdk11

# Pnpm is used to install packages
RUN curl -f https://get.pnpm.io/v6.16.js | node - add --global pnpm

RUN USER=node && \
    GROUP=node && \
    curl -SsL https://github.com/boxboat/fixuid/releases/download/v0.5.1/fixuid-0.5.1-linux-amd64.tar.gz | tar -C /usr/local/bin -xzf - && \
    chown root:root /usr/local/bin/fixuid && \
    chmod 4755 /usr/local/bin/fixuid && \
    mkdir -p /etc/fixuid && \
    printf "user: $USER\ngroup: $GROUP\n" > /etc/fixuid/config.yml

USER node:node
WORKDIR /home/node

ENV NODE_ENV production

# Tell Puppeteer to skip installing Chrome. We'll be using the installed package.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

COPY --chown=node:node package.json pnpm-lock.yaml ./

RUN chown -R node:node /home/node

RUN pnpm install --frozen-lockfile --prod

COPY --chown=node:node index.html index.js index.html ./
COPY --chown=node:node resources/js/ ./resources/js/
COPY --chown=node:node resources/css/ ./resources/css/
COPY --chown=node:node src/ ./src/

EXPOSE 3000

ENTRYPOINT ["fixuid"]
CMD [ "node", "index.js" ]
