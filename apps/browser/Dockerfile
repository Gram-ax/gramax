FROM --platform=$BUILDPLATFORM gitlab.ics-it.ru:4567/ics/doc-reader:base-image-${BRANCH:-"develop"} AS deps

WORKDIR /src

COPY ./package.json ./package-lock.json ./
COPY  ./apps/browser/package.json ./apps/browser/

RUN npm ci -f

FROM deps AS build

WORKDIR /src

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

FROM gitlab.ics-it.ru:4567/ics/doc-reader:spa-${BRANCH:-develop} AS run

WORKDIR /app

ENV PORT=80

COPY --from=build /src/apps/browser/dist .

CMD spa "-p" $PORT static -d "/app" -f "index.html"
