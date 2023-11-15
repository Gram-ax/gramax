FROM node:20-alpine as deps

WORKDIR /src

RUN [ "apk", "update" ]; [ "apk", "upgrade" ]
RUN [ "apk", "--no-cache", "add", "nodejs-current", "npm", "git", "fd", "chromium", "bash" ]

COPY . .

RUN ["sh", "install-deps.sh"]

FROM deps as build

ARG ENTERPRISE_SERVER_URL
ARG BUGSNAG_API_KEY
ARG SUBMODULE_BRANCH_NAME

WORKDIR /src/target/browser

RUN [ "npm", "run", "build" ]

FROM devforth/spa-to-http:latest

WORKDIR /app

ENV PORT=80
COPY --from=build /src/target/browser/dist .

CMD [ "go-http-server" ]