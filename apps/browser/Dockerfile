FROM --platform=$BUILDPLATFORM gitlab.ics-it.ru:4567/ics/doc-reader:base-image as deps

WORKDIR /src

COPY ./package.json ./package-lock.json ./
COPY  ./apps/browser/package.json ./apps/browser/

RUN npm ci

FROM deps as build

WORKDIR /src

RUN [ "apt-get", "install", "-y", "git", "bash" ]

COPY . .

RUN rm -r services

RUN ["./install-deps.sh", "--ci", "--build-plugins"]

ARG BUGSNAG_API_KEY BRANCH COOKIE_SECRET VITE_SOURCEMAPS REVIEW_SERVICE_URL CORS_PROXY_SERVICE_URL STORAGE_URL DIAGRAM_RENDERER_SERVICE_URL
ENV BUGSNAG_API_KEY=${BUGSNAG_API_KEY} BRANCH=${BRANCH} COOKIE_SECRET=${COOKIE_SECRET} VITE_SOURCEMAPS={$VITE_SOURCEMAPS} REVIEW_SERVICE_URL=${REVIEW_SERVICE_URL} CORS_PROXY_SERVICE_URL=${CORS_PROXY_SERVICE_URL} STORAGE_URL=${STORAGE_URL} DIAGRAM_RENDERER_SERVICE_URL=${DIAGRAM_RENDERER_SERVICE_URL}
ENV NODE_OPTIONS=--max_old_space_size=8192

RUN [ "npm", "--prefix", "apps/browser", "run", "build" ]

FROM gitlab.ics-it.ru:4567/ics/doc-reader:warp-spa

WORKDIR /app

ENV PORT=80
COPY --from=build /src/apps/browser/dist .

CMD [ "warp-spa" ]
