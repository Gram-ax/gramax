FROM --platform=$BUILDPLATFORM node:21-alpine3.18 as deps
RUN apk add git bash

WORKDIR /app
COPY ./package.json ./package-lock.json ./.npmrc ./
RUN npm ci -f

WORKDIR /app/target/browser
COPY ./target/browser/package.json ./target/browser/package-lock.json ./
RUN npm ci -f

WORKDIR /app/target/tauri
COPY ./target/tauri/package.json ./target/tauri/package-lock.json ./target/browser/.npmrc ./
RUN npm ci -f

WORKDIR /app/target/next
COPY ./target/next/package.json ./target/next/package-lock.json ./target/next/.npmrc ./
RUN npm ci -f

#

FROM deps as builder

WORKDIR /app
COPY . .

RUN npm run build:schemes

WORKDIR /app/target/next
RUN npm run build

WORKDIR /app
RUN rm -fr /app/e2e /app/target/browser /app/target/tauri /app/target/next/.next/cache
RUN find . -name ".npmrc" -type f -exec rm -f {} +
RUN npm i --omit=dev -f

#

FROM --platform=$TARGETPLATFORM node:21-alpine3.18 as Runner

WORKDIR /app
RUN apk add --no-cache bash git

ENV PORT=80
ENV ENTERPRISE_SERVER_URL=http://gramax-diagram-renderer:80
ENV SERVER_APP=true
ENV SSO_SERVER_URL=http://localhost:3000
ENV READ_ONLY=true
ENV ROOT_PATH=/app/data

RUN mkdir $ROOT_PATH
COPY --from=builder /app .

WORKDIR /app/target/next

ENTRYPOINT npm run start
