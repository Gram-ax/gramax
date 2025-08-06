ARG CI_DEPENDENCY_PROXY_GROUP_IMAGE_PREFIX=docker.io

FROM ${CI_DEPENDENCY_PROXY_GROUP_IMAGE_PREFIX}/rust:1.88-slim-bookworm AS build

WORKDIR /src

COPY . .

RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    git \
    unzip \
    && rm -rf /var/lib/apt/lists/* \
    && curl -fsSL https://bun.sh/install | bash

ENV PATH="/root/.bun/bin:$PATH"

RUN cargo install --path crates/spa

FROM ${CI_DEPENDENCY_PROXY_GROUP_IMAGE_PREFIX}/debian:bookworm-slim AS run

RUN apt-get update && apt-get install -y \
    curl \
    git \
    unzip \
    && curl -fsSL https://bun.sh/install | bash \
    && rm -rf /var/lib/apt/lists/* 

ENV PATH="/root/.bun/bin:$PATH"

STOPSIGNAL SIGTERM

COPY --from=build /usr/local/cargo/bin/spa /usr/bin/spa
