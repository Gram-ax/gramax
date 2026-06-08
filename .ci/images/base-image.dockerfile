ARG CI_DEPENDENCY_PROXY_GROUP_IMAGE_PREFIX=docker.io

FROM ${CI_DEPENDENCY_PROXY_GROUP_IMAGE_PREFIX}/rust:1.91-bookworm

ENV PATH="/root/.cargo/bin:/usr/local/bin:/root/.bun/bin:${PATH}"

RUN apt-get update && \
	apt-get upgrade -y && \
	apt-get install -y --no-install-recommends \
	git \
	curl \
	make \
	cmake \
	unzip \
	pkg-config \
	build-essential \
	fontconfig \
	imagemagick \
	libfontconfig1 \
	python3 \
	caddy && \
	apt-get clean && \
	rm -rf /var/lib/apt/lists/*

RUN set -eux; \
	curl -fsSL https://bun.com/install | bash -s "bun-v1.3.13"; \
	bun --version

RUN curl -fsSL -o /usr/local/bin/n https://raw.githubusercontent.com/tj/n/master/bin/n && \
	chmod +x /usr/local/bin/n && \
	n install stable && \
	n install 20 && \
	n use 20 && \
	n use stable
