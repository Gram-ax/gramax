ARG CI_DEPENDENCY_PROXY_GROUP_IMAGE_PREFIX

FROM ${CI_DEPENDENCY_PROXY_GROUP_IMAGE_PREFIX}/node:21-alpine as deps

WORKDIR /src

RUN [ "apk", "--no-cache", "add", "git", "bash" ]

COPY . .

RUN rm -r services

RUN ["sh", "install-deps.sh"]

FROM deps as build

ARG ENTERPRISE_SERVER_URL BUGSNAG_API_KEY BRANCH COOKIE_SECRET VITE_SOURCEMAPS
ENV ENTERPRISE_SERVER_URL=${ENTERPRISE_SERVER_URL} BUGSNAG_API_KEY=${BUGSNAG_API_KEY} BRANCH=${BRANCH} COOKIE_SECRET=${COOKIE_SECRET} VITE_SOURCEMAPS={$VITE_SOURCEMAPS}
ENV NODE_OPTIONS=--max_old_space_size=8192

RUN [ "npm", "--prefix", "target/browser", "run", "build" ]

FROM ${CI_DEPENDENCY_PROXY_GROUP_IMAGE_PREFIX}/devforth/spa-to-http:latest

WORKDIR /app

ENV PORT=80
COPY --from=build /src/target/browser/dist .

CMD [ "go-http-server" ]