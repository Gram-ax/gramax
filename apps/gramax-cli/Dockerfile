FROM --platform=$BUILDPLATFORM gitlab.ics-it.ru:4567/ics/doc-reader:base-image AS deps

WORKDIR /src

RUN [ "apt-get", "install", "-y", "git", "bash" ]

COPY . .

RUN rm -r services

RUN ["./install-deps.sh", "--ci"]

ENV NODE_OPTIONS=--max_old_space_size=8192

RUN [ "npm", "--prefix", "apps/gramax-cli", "run", "build" ]

WORKDIR /src/apps/gramax-cli/dist

RUN echo "//registry.npmjs.org/:_authToken=${NPM_PUBLISH_TOKEN}" > ~/.npmrc

RUN ["npm", "publish"]
