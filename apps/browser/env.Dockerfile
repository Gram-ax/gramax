FROM --platform=$BUILDPLATFORM gitlab.ics-it.ru:4567/ics/doc-reader:base-image-${BRANCH:-"develop"} AS deps

WORKDIR /src

COPY ./package.json ./package-lock.json ./
COPY  ./apps/browser/package.json ./apps/browser/

RUN npm ci

FROM deps AS build

WORKDIR /src

RUN [ "apt-get", "install", "-y", "git", "bash" ]

COPY . .

RUN rm -r services

RUN ["./install-deps.sh", "--ci"]

ARG BUGSNAG_API_KEY \
    BRANCH \
    COOKIE_SECRET \
    PRODUCTION \
    GEPS_URL=https://gram.ax/enterprise-provider 
ENV NODE_OPTIONS=--max_old_space_size=8192 \
    BUGSNAG_API_KEY=${BUGSNAG_API_KEY} \
    BRANCH=${BRANCH} \
    PRODUCTION=${PRODUCTION} \
    COOKIE_SECRET=${COOKIE_SECRET} \
    GEPS_URL=${GEPS_URL}

RUN [ "npm", "--prefix", "apps/browser", "run", "build" ]


FROM node:22-bookworm-slim

WORKDIR /app

ENV PORT=80
COPY --from=build /src/apps/browser/dist ./dist
COPY --from=build /src/scripts/compileTimeEnv.mjs .
COPY --from=build /src/scripts/browserEnv .

RUN ls -la && \
    node replaseIndex.mjs && \
    npm init -y && \
    npm install express && \
    apt update -y && apt -y install curl unzip && \
    rm -rf /var/lib/apt/lists/* && \
    curl -LO https://github.com/oven-sh/bun/releases/latest/download/bun-linux-x64-baseline.zip; unzip -j bun-linux-x64-baseline.zip 'bun-linux-x64-baseline/bun' -d /usr/local/bin; rm bun-linux-x64-baseline.zip;

CMD [ "bun", "browserEnvServer.mjs" ]
