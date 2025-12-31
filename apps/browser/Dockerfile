ARG BRANCH="develop"

FROM --platform=$BUILDPLATFORM gitlab.ics-it.ru:4567/ics/doc-reader:base-image-${BRANCH} AS deps

WORKDIR /src

COPY . .

RUN rm -r services

RUN ["./install-deps.sh", "--ci"]

ARG BUGSNAG_API_KEY
ARG COOKIE_SECRET
ARG PRODUCTION
ARG BRANCH

ENV NODE_OPTIONS=--max_old_space_size=8192 \
    BUGSNAG_API_KEY=${BUGSNAG_API_KEY} \
    BRANCH=${BRANCH} \
    PRODUCTION=${PRODUCTION} \
    COOKIE_SECRET=${COOKIE_SECRET} 

RUN [ "npm", "--prefix", "apps/browser", "run", "build" ]

FROM gitlab.ics-it.ru:4567/ics/doc-reader:spa-${BRANCH} AS run

WORKDIR /app

ENV PORT=80

COPY --from=deps /src/apps/browser/dist .

RUN groupadd --system --gid 10001 app && useradd --system --uid 10001 --gid app --home-dir /app --shell /usr/sbin/nologin app && \
    chown -R 10001:10001 /app

USER 10001:10001

CMD spa "-p" $PORT static -d "/app" -f "index.html"
