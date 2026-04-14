ARG BRANCH="dev"
ARG PRODUCTION="true"

FROM --platform=$BUILDPLATFORM gitlab.ics-it.ru:4567/ics/doc-reader/base-image:latest-dev AS deps

WORKDIR /src

COPY . .

RUN rm -rf services

RUN ["./install-deps.sh", "--ci"]

ARG BUGSNAG_API_KEY
ARG PRODUCTION
ARG BRANCH

ENV NODE_OPTIONS=--max_old_space_size=8192 \
    BUGSNAG_API_KEY=${BUGSNAG_API_KEY} \
    BRANCH=${BRANCH} \
    PRODUCTION=${PRODUCTION}

RUN [ "npm", "--prefix", "apps/docportal", "run", "build" ]

FROM oven/bun:canary-alpine AS run

RUN apt-get update  && \
    apt-get install -y --no-install-recommends bash fontconfig ca-certificates

WORKDIR /app

ENV PORT=80

COPY --from=deps /src/apps/docportal/dist .

RUN groupadd --system --gid 10001 app && useradd --system --uid 10001 --gid app --home-dir /app --shell /usr/sbin/nologin app && \
    chown -R 10001:10001 /app

USER 10001:10001

ENTRYPOINT ["bun", "run", "index.js"]
