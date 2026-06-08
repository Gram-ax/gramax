ARG BRANCH
ARG USE_IMAGE_TAG="latest-dev"

FROM gitlab.ics-it.ru:4567/ics/doc-reader/spa:${USE_IMAGE_TAG:-latest-dev} AS spa

FROM mcr.microsoft.com/playwright:v1.57.0-noble

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && \
	apt-get install -y --no-install-recommends \
		curl \
		git \
		unzip \
		ca-certificates \
		gnupg \
		pkg-config \
		build-essential \
		python3 \
		libpixman-1-dev \
		libcairo2-dev \
		libpango1.0-dev \
		libjpeg-dev \
		libgif-dev \
		librsvg2-dev \
		libkrb5-dev && \
	curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg && \
	curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list && \
	apt-get update && \
	apt-get install -y --no-install-recommends caddy && \
	rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://bun.com/install | bash && \
	curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y && \
	curl -fsSL -o /usr/local/bin/n https://raw.githubusercontent.com/tj/n/master/bin/n && \
	chmod +x /usr/local/bin/n && \
	n install 20 && \
	n use 20

ENV PATH="/root/.bun/bin:/root/.cargo/bin:${PATH}"

RUN pkg-config --exists pixman-1 && \
	pkg-config --exists cairo && \
	pkg-config --exists pango && \
	test -f /usr/include/gssapi/gssapi.h

RUN mkdir -p /etc/apt/keyrings && \
	curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc && \
	chmod a+r /etc/apt/keyrings/docker.asc && \
	echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
	$(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}") stable" > /etc/apt/sources.list.d/docker.list && \
	apt-get update && \
	apt-get install -y --no-install-recommends \
		docker-ce-cli \
		docker-compose-plugin && \
	rm -rf /var/lib/apt/lists/*

COPY --from=spa /usr/bin/spa /usr/bin/spa