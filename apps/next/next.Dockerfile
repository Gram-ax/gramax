ARG NEXUS_DOCKERHUB=docker.io
ARG USE_IMAGE_TAG="latest-dev"
ARG NODE_VERSION=24.22.1

FROM --platform=$BUILDPLATFORM gitlab.ics-it.ru:4567/ics/doc-reader/base-image:${USE_IMAGE_TAG:-latest-dev} AS deps

ARG NODE_VERSION

WORKDIR /app

RUN n install "${NODE_VERSION}"

ARG BUGSNAG_API_KEY \
  PRODUCTION \
  BASE_PATH \
  BRANCH \
  UPLOAD_SOURCE_MAPS_TO_BUGSNAG=false

ENV BUGSNAG_API_KEY=${BUGSNAG_API_KEY} \
  PRODUCTION=${PRODUCTION} \
  BASE_PATH=${BASE_PATH} \
  ROOT_PATH=/app/data \
  BRANCH=${BRANCH} \
  UPLOAD_SOURCE_MAPS_TO_BUGSNAG=${UPLOAD_SOURCE_MAPS_TO_BUGSNAG}

COPY . .

ENV CARGO_NET_GIT_FETCH_WITH_CLI=true

RUN --mount=type=secret,id=npmrc,target=/root/.npmrc \
  --mount=type=secret,id=github-token \
  if [ -s /run/secrets/github-token ]; then git config --global credential."https://github.com".helper '!f() { echo username=x-access-token; echo "password=$(cat /run/secrets/github-token)"; }; f'; fi && \
  ./install-deps.sh --ci --node && \
  npm rebuild better-sqlite3 --build-from-source && \
  node -e "const Database = require('better-sqlite3'); const db = new Database(':memory:'); db.close();" && \
  node ./scripts/generateVersion.mjs && \
  npm --prefix apps/next run build && \
  rm -fr .npm ./target ./apps/next/.next/cache ./.git ~/.gitconfig

FROM --platform=$TARGETPLATFORM ${NEXUS_DOCKERHUB}/node:${NODE_VERSION}-bookworm-slim AS run

# Fail the build if Node.js lacks the CVE-2026-111497 Brotli decoder fix.
RUN node -e "if (typeof require('node:zlib').constants.BROTLI_DECODER_ERROR_FORMAT_BLOCK_SWITCH !== 'number') { throw new Error('Missing Brotli CVE-2026-111497 fix'); }"

WORKDIR /app

RUN apt-get update && apt-get upgrade -y && \
  apt-get install -y --no-install-recommends git bash fontconfig ca-certificates && \
  apt-get clean && \
  rm -rf /var/lib/apt/lists/*

ARG BUGSNAG_API_KEY \
  PRODUCTION \
  SHARE_ACCESS_TOKEN \
  BASE_PATH \
  BRANCH \
  COOKIE_SECRET="."

ENV PORT=80 \
  PRODUCTION=${PRODUCTION} \
  ROOT_PATH=/app/data \
  BASE_PATH=${BASE_PATH} \
  BRANCH=${BRANCH} \
  BUGSNAG_API_KEY=${BUGSNAG_API_KEY} \
  AUTO_PULL_INTERVAL=180 \
  AUTO_PULL_TOKEN="" \
  AUTO_PULL_USERNAME="" \
  COOKIE_SECRET=${COOKIE_SECRET} \
  SHARE_ACCESS_TOKEN=${SHARE_ACCESS_TOKEN} 

RUN mkdir -p $ROOT_PATH
COPY --from=deps /app .

# TODO: temp solution; delete in future
RUN git config --global url."https://gitlab.ics-it.ru/".insteadOf git@gitlab.ics-it.ru:

STOPSIGNAL SIGTERM

WORKDIR /app/apps/next

ENTRYPOINT ["npm", "run", "start"]
