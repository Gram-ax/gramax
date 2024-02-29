ARG CI_DEPENDENCY_PROXY_GROUP_IMAGE_PREFIX


FROM --platform=$BUILDPLATFORM ${CI_DEPENDENCY_PROXY_GROUP_IMAGE_PREFIX}/node:21-alpine as build

RUN apk add --no-cache git bash

WORKDIR /app

COPY . .
RUN ./install-deps.sh --ci
RUN npm --prefix target/next run build

RUN rm -rf .npm

FROM --platform=$BUILDPLATFORM ${CI_DEPENDENCY_PROXY_GROUP_IMAGE_PREFIX}/node:21-alpine as run

RUN apk add --no-cache git bash

ENV PORT=80
ENV ENTERPRISE_SERVER_URL=http://gramax-diagram-renderer:80
ENV SERVER_APP=true
ENV READ_ONLY=true
ENV ROOT_PATH=/app/data
ARG BRANCH
ENV BRANCH=${BRANCH}
ARG SHARE_ACCESS_TOKEN
ENV SHARE_ACCESS_TOKEN=${SHARE_ACCESS_TOKEN}

RUN echo $SHARE_ACCESS_TOKEN

# TODO: Move to build args
# ENV SSO_SERVER_URL=http://localhost:3000

ARG COOKIE_SECRET="."
ENV COOKIE_SECRET=${COOKIE_SECRET}

RUN mkdir -p $ROOT_PATH
COPY --from=build /app .

CMD npm --prefix target/next run start
