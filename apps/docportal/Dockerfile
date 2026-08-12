ARG CI_DEPENDENCY_PROXY_GROUP_IMAGE_PREFIX=docker.io
ARG USE_IMAGE_TAG="latest-dev"

FROM --platform=$BUILDPLATFORM gitlab.ics-it.ru:4567/ics/doc-reader/base-image:${USE_IMAGE_TAG:-latest-dev} AS deps

WORKDIR /app

COPY . .

RUN rm -rf services

ARG BUGSNAG_API_KEY
ARG PRODUCTION
ARG BRANCH

ENV NODE_OPTIONS=--max_old_space_size=8192 \
    BUGSNAG_API_KEY=${BUGSNAG_API_KEY} \
    BRANCH=${BRANCH} \
    PRODUCTION=${PRODUCTION}

RUN n install 23 && \
    ./install-deps.sh --ci --node && \
    npm --prefix apps/docportal run build

FROM --platform=$TARGETPLATFORM ${CI_DEPENDENCY_PROXY_GROUP_IMAGE_PREFIX}/oven/bun:canary AS run

RUN apt-get update && \
    apt-get install -y --no-install-recommends bash fontconfig ca-certificates && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV PORT=80 \
    COOKIE_SECRET="." \
    ROOT_PATH=/app/data \
    BRANCH=${BRANCH} \
    BASE_PATH=${BASE_PATH} \
    PRODUCTION=${PRODUCTION} \
    COOKIE_SECRET=${COOKIE_SECRET} \
    BUGSNAG_API_KEY=${BUGSNAG_API_KEY} \
    SHARE_ACCESS_TOKEN=${SHARE_ACCESS_TOKEN} \
    AUTO_PULL_TOKEN="" \
    AUTO_PULL_USERNAME="" \
    AUTO_PULL_INTERVAL=180 


COPY --from=deps /app .

# RUN groupadd --system --gid 10001 app && useradd --system --uid 10001 --gid app app && \
#     mkdir -p /app/config /app/certs && \
#     chown -R app:app /app

# USER 10001:10001

WORKDIR /app/apps/docportal

ENTRYPOINT ["bun", "run", "start"]
