ARG BRANCH
ARG USE_IMAGE_TAG="latest-dev"

FROM gitlab.ics-it.ru:4567/ics/doc-reader/spa:${USE_IMAGE_TAG:-latest-dev} AS spa

FROM mcr.microsoft.com/playwright:v1.57.0-noble

RUN apt-get update && apt-get upgrade -y && \
	apt-get install -y \
	make \
	unzip \
	curl \
	pkg-config \
	build-essential \
	git && \
 	apt-get install -y debian-keyring debian-archive-keyring apt-transport-https && \
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg && \
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list && \
  apt-get update && apt-get install -y caddy && \
	rm -rf /var/lib/apt/lists/* && \
	apt-get clean

RUN curl -fsSL https://bun.com/install | bash && \
	curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y && \
	curl -fsSL -o /usr/local/bin/n https://raw.githubusercontent.com/tj/n/master/bin/n && \
	chmod +x /usr/local/bin/n && \
	n install stable && \
	n install 20 && \
	n use 20 && \
	n use stable

ENV PATH="/root/.bun/bin:/root/.cargo/bin:${PATH}"

RUN curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc && chmod a+r /etc/apt/keyrings/docker.asc && \
	echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
	$(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}") stable" > /etc/apt/sources.list.d/docker.list && \
	apt-get update && apt-get install -y --no-install-recommends docker-ce docker-ce-cli containerd.io docker-compose-plugin && \
	rm -rf /var/lib/apt/lists/* && \
	apt-get clean

COPY --from=spa /usr/bin/spa /usr/bin/spa
