FROM node:20-alpine as deps

WORKDIR /src


RUN [ "apk", "update" ]; [ "apk", "upgrade" ]
RUN [ "apk", "--no-cache", "add", "git", "fd", "bash" ]

COPY . .

RUN rm -r services/*

RUN ["sh", "install-deps.sh"]

FROM deps as build

ARG ENTERPRISE_SERVER_URL BUGSNAG_API_KEY BRANCH COOKIE_SECRET
ENV NODE_OPTIONS=--max_old_space_size=4096

WORKDIR /src/target/browser

RUN [ "npm", "run", "build" ]

FROM devforth/spa-to-http:latest

WORKDIR /app

ENV PORT=80
COPY --from=build /src/target/browser/dist .

CMD [ "go-http-server" ]