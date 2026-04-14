ARG CI_DEPENDENCY_PROXY_GROUP_IMAGE_PREFIX=docker.io

FROM ${CI_DEPENDENCY_PROXY_GROUP_IMAGE_PREFIX}/rust:1.91-bookworm

RUN apt-get update && \
	apt-get upgrade -y && \
	apt-get install -y --no-install-recommends \
	git \
	curl \
	make \
	cmake \
	unzip \
	python3 \
	pkg-config \
	build-essential \
	fontconfig \
	imagemagick \
	libfontconfig1 \
	caddy && \
	apt-get clean && \
	rm -rf /var/lib/apt/lists/*

RUN set -eux; \
	curl -fsSL "https://github.com/oven-sh/bun/releases/download/bun-v1.2.23/bun-linux-x64-baseline.zip" -o /tmp/bun.zip; \
	unzip -q /tmp/bun.zip -d /tmp; \
	install -m 0755 /tmp/bun-*/bun /usr/local/bin/bun; \
	rm -rf /tmp/bun.zip /tmp/bun-*; \
	bun --version

RUN curl -fsSL -o /usr/local/bin/n https://raw.githubusercontent.com/tj/n/master/bin/n && \
	chmod +x /usr/local/bin/n && \
	n install stable && \
	n install 20 && \
	n use 20 && \
	n use stable

ENV PATH="/root/.cargo/bin:/usr/local/bin:${PATH}"