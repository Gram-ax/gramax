ARG NEXUS_DOCKERHUB

FROM ${NEXUS_DOCKERHUB}/rust:1.91-slim-bookworm AS build

WORKDIR /src

COPY . .

RUN apt-get update && apt-get install -y --no-install-recommends \
	ca-certificates \
	curl \
	git \
	unzip \
	&& rm -rf /var/lib/apt/lists/*

ARG RUNNER_HTTPS_PROXY

RUN export HTTPS_PROXY=$RUNNER_HTTPS_PROXY && \
	curl --retry 3 --retry-delay 5 -fsSL https://bun.sh/install | bash

ENV PATH="/root/.bun/bin:$PATH"

RUN cargo install --path crates/spa

FROM ${NEXUS_DOCKERHUB}/oven/bun:debian AS run

RUN apt-get update && apt-get upgrade -y && apt-get install -y --no-install-recommends \
	curl \
	unzip \
	git \
	&& rm -rf /var/lib/apt/lists/*

STOPSIGNAL SIGTERM

COPY --from=build /usr/local/cargo/bin/spa /usr/bin/spa
