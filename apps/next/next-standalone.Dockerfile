ARG CI_DEPENDENCY_PROXY_GROUP_IMAGE_PREFIX=docker.io
ARG USE_IMAGE_TAG="latest-dev"

FROM --platform=$BUILDPLATFORM gitlab.ics-it.ru:4567/ics/doc-reader/base-image:${USE_IMAGE_TAG:-latest-dev} AS deps

WORKDIR /app

ARG BUGSNAG_API_KEY \
  PRODUCTION

ENV BUGSNAG_API_KEY=${BUGSNAG_API_KEY} \
  PRODUCTION=${PRODUCTION} \
  ROOT_PATH=/app/data

COPY . .

RUN ./install-deps.sh --ci --node && \
  npm --prefix apps/next run build:standalone && \
  git gc --aggressive && git prune && \
  rm -fr ./.npm ./target ./apps/next/.next/cache

FROM --platform=$TARGETPLATFORM ${CI_DEPENDENCY_PROXY_GROUP_IMAGE_PREFIX}/node:21-bookworm-slim AS run

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

WORKDIR /app/apps/next

ENTRYPOINT ["node", "./server.js"]
