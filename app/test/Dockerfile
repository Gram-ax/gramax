FROM node:20-alpine

WORKDIR /app/reader
ENV PORT 80

RUN apk add --no-cache \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    bash \
    git \
    fd \
    yarn

COPY . .

RUN node -v && \
    npm -v && \
    ./install-deps.sh --ci && \
    npm run test:unit && \
    npm run test:int
