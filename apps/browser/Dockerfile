FROM --platform=$BUILDPLATFORM gitlab.ics-it.ru:4567/ics/doc-reader:base-image-${BRANCH:-develop} AS deps

WORKDIR /src

COPY ./package.json ./package-lock.json ./
COPY  ./apps/browser/package.json ./apps/browser/

RUN npm ci -f

FROM deps AS build

WORKDIR /src

RUN [ "apt-get", "install", "-y", "git", "bash" ]

COPY . .

RUN rm -r services

RUN ["./install-deps.sh", "--ci"]

ARG BUGSNAG_API_KEY \
    BRANCH \
    COOKIE_SECRET \
    REVIEW_SERVICE_URL \
    GIT_PROXY_SERVICE_URL \
    PRODUCTION \
    DIAGRAM_RENDERER_SERVICE_URL \
    GEPS_URL=https://gram.ax/enterprise-provider \
    AUTH_SERVICE_URL
ENV NODE_OPTIONS=--max_old_space_size=8192 \
    BUGSNAG_API_KEY=${BUGSNAG_API_KEY} \
    BRANCH=${BRANCH} \
    PRODUCTION=${PRODUCTION} \
    COOKIE_SECRET=${COOKIE_SECRET} \
    REVIEW_SERVICE_URL=${REVIEW_SERVICE_URL} \
    GIT_PROXY_SERVICE_URL=${GIT_PROXY_SERVICE_URL} \
    DIAGRAM_RENDERER_SERVICE_URL=${DIAGRAM_RENDERER_SERVICE_URL} \
    AUTH_SERVICE_URL=${AUTH_SERVICE_URL} \
    GEPS_URL=${GEPS_URL}

RUN [ "npm", "--prefix", "apps/browser", "run", "build" ]

FROM gitlab.ics-it.ru:4567/ics/doc-reader:warp-spa

WORKDIR /app

ENV PORT=80
COPY --from=build /src/apps/browser/dist .

CMD [ "warp-spa" ]
