ARG NEXUS_DOCKERHUB=docker.io
ARG USE_IMAGE_TAG="latest-dev"
ARG NODE_VERSION=24.22.1

FROM --platform=$BUILDPLATFORM gitlab.ics-it.ru:4567/ics/doc-reader/base-image:${USE_IMAGE_TAG:-latest-dev} AS deps

ARG NODE_VERSION

WORKDIR /app

RUN n install "${NODE_VERSION}"

ARG BUGSNAG_API_KEY \
  PRODUCTION

ENV BUGSNAG_API_KEY=${BUGSNAG_API_KEY} \
  PRODUCTION=${PRODUCTION} \
  ROOT_PATH=/app/data

COPY . .

RUN ./install-deps.sh --ci --node && \
  npm rebuild better-sqlite3 --build-from-source && \
  node -e "const Database = require('better-sqlite3'); const db = new Database(':memory:'); db.close();" && \
  npm --prefix apps/next run build:standalone && \
  git gc --aggressive && git prune && \
  rm -fr ./.npm ./target ./apps/next/.next/cache

FROM --platform=$TARGETPLATFORM ${NEXUS_DOCKERHUB}/node:${NODE_VERSION}-bookworm-slim AS run

# Fail the build if Node.js lacks the CVE-2026-111497 Brotli decoder fix.
RUN node -e "if (typeof require('node:zlib').constants.BROTLI_DECODER_ERROR_FORMAT_BLOCK_SWITCH !== 'number') { throw new Error('Missing Brotli CVE-2026-111497 fix'); }"

ARG BRANCH \
  BUGSNAG_API_KEY \
  PRODUCTION \
  SHARE_ACCESS_TOKEN \
  COOKIE_SECRET="."

ENV PORT=80 \
  DIAGRAM_RENDERER_SERVICE_URL=http://gramax-diagram-renderer:80 \
  PRODUCTION=${PRODUCTION} \
  ROOT_PATH=/app/data \
  BRANCH=${BRANCH} \
  BUGSNAG_API_KEY=${BUGSNAG_API_KEY} \
  AUTO_PULL_INTERVAL=180 \
  AUTO_PULL_TOKEN="" \
  AUTO_PULL_USERNAME="" \
  SHARE_ACCESS_TOKEN=${SHARE_ACCESS_TOKEN} \
  COOKIE_SECRET=${COOKIE_SECRET}

RUN apt-get update && \
  apt-get install -y --no-install-recommends git bash && \
  apt-get clean && \
  mkdir -p $ROOT_PATH

COPY --from=deps /app/apps/next/.next/standalone /app \
  /app/apps/next/.next/static /app/apps/next/.next/static/ \
  /app/apps/next/.next/server /app/apps/next/.next/server/
COPY --from=deps /app/scripts/diagnostics/catalogs.mjs /app/scripts/diagnostics/catalogs.mjs

WORKDIR /app/apps/next

ENTRYPOINT ["node", "./server.js"]
