ARG CI_DEPENDENCY_PROXY_GROUP_IMAGE_PREFIX

FROM --platform=$BUILDPLATFORM gitlab.ics-it.ru:4567/ics/doc-reader:base-image as build

WORKDIR /app

ENV ROOT_PATH=/app/data

COPY . .
RUN ./install-deps.sh --ci --build-plugins --node && \
  npm --prefix apps/next run build && \
  rm -rf .npm

FROM --platform=$BUILDPLATFORM ${CI_DEPENDENCY_PROXY_GROUP_IMAGE_PREFIX}/node:21-bookworm as run

WORKDIR /app

RUN apt-get update && \
  apt-get install git bash && \
  apt-get clean

ARG BRANCH \
  SHARE_ACCESS_TOKEN \
  COOKIE_SECRET="."

ENV PORT=80 \
  DIAGRAM_RENDERER_SERVICE_URL=http://gramax-diagram-renderer:80 \
  SERVER_APP=true \
  READ_ONLY=true \
  ROOT_PATH=/app/data \
  BRANCH=${BRANCH} \
  AUTO_PULL_INTERVAL=180 \
  AUTO_PULL_TOKEN="" \
  SHARE_ACCESS_TOKEN=${SHARE_ACCESS_TOKEN} \
  COOKIE_SECRET=${COOKIE_SECRET}

# TODO: Move to build args
# ENV SSO_SERVICE_URL=http://localhost:3000

RUN mkdir -p $ROOT_PATH
COPY --from=build /app .

STOPSIGNAL SIGTERM

CMD npm --prefix apps/next run start
