ARG CI_DEPENDENCY_PROXY_GROUP_IMAGE_PREFIX

FROM ${CI_DEPENDENCY_PROXY_GROUP_IMAGE_PREFIX}/node:20-alpine as deps

WORKDIR /src

RUN [ "apk", "update" ]; [ "apk", "upgrade" ]
RUN [ "apk", "--no-cache", "add", "nodejs-current", "npm", "git", "fd", "bash" ]

COPY . .

RUN rm -r services/*

RUN ["sh", "install-deps.sh"]

FROM deps as build

ENV NODE_OPTIONS=--max_old_space_size=4096

WORKDIR /src/storybook

RUN [ "npm", "run", "build" ]

FROM ${CI_DEPENDENCY_PROXY_GROUP_IMAGE_PREFIX}/devforth/spa-to-http:latest

WORKDIR /app

ENV PORT=80
EXPOSE 80

COPY --from=build /src/storybook/storybook-static .

CMD [ "go-http-server", "--spa", "false" ]