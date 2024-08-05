ARG CI_DEPENDENCY_PROXY_GROUP_IMAGE_PREFIX=docker.io

FROM --platform=$BUILDPLATFORM ${CI_DEPENDENCY_PROXY_GROUP_IMAGE_PREFIX}/node:22-bookworm-slim AS deps

WORKDIR /app

COPY ./package.json ./package-lock.json ./
COPY ./apps/browser/package.json ./apps/browser/
COPY ./apps/tauri/package.json ./apps/tauri/
COPY ./apps/next/package.json ./apps/next/
COPY ./apps/next/rlibs/next-gramax-git/package.json ./apps/next/rlibs/next-gramax-git/

RUN npm ci

# TODO: rust caching
# COPY ./Cargo.toml ./Cargo.lock ./recipe.json ./

# RUN cargo install cargo-chef && \
#   cargo chef cook --release --recipe-path recipe.json -p next-gramax-git

FROM --platform=$TARGETPLATFORM gitlab.ics-it.ru:4567/ics/doc-reader:base-image AS build

WORKDIR /app

ARG BUGSNAG_API_KEY \
  PRODUCTION 

ENV BUGSNAG_API_KEY=${BUGSNAG_API_KEY} \
  PRODUCTION=${PRODUCTION} \
  ROOT_PATH=/app/data

COPY --from=deps /app .
COPY . .

RUN ./install-deps.sh --ci --build-plugins --node && \
  npm --prefix apps/next run build && \
  rm -rf .npm && \
  git gc --aggressive && \
  git prune && \
  rm -fr ./target ./apps/next/.next/cache 

FROM --platform=$TARGETPLATFORM ${CI_DEPENDENCY_PROXY_GROUP_IMAGE_PREFIX}/node:21-bookworm-slim AS run

WORKDIR /app

RUN apt-get update && \
  apt-get install -y git bash && \
  apt-get clean

ARG BRANCH \
  BUGSNAG_API_KEY \
  PRODUCTION \
  SHARE_ACCESS_TOKEN \
  COOKIE_SECRET="."

ENV PORT=80 \
  DIAGRAM_RENDERER_SERVICE_URL=http://gramax-diagram-renderer:80 \
  PRODUCTION=${PRODUCTION} \
  SERVER_APP=true \
  READ_ONLY=true \
  ROOT_PATH=/app/data \
  BRANCH=${BRANCH} \
  BUGSNAG_API_KEY=${BUGSNAG_API_KEY} \
  AUTO_PULL_INTERVAL=180 \
  AUTO_PULL_TOKEN="" \
  SHARE_ACCESS_TOKEN=${SHARE_ACCESS_TOKEN} \
  COOKIE_SECRET=${COOKIE_SECRET}

# TODO: Move to build args
# ENV SSO_SERVICE_URL=http://localhost:3000

RUN mkdir -p $ROOT_PATH
COPY --from=build /app .

STOPSIGNAL SIGTERM

CMD ["npm", "--prefix", "apps/next", "run", "start"]
