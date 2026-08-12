ARG NEXUS_DOCKERHUB

FROM ${NEXUS_DOCKERHUB}/rust:1.91-bookworm

ENV PATH="/root/.cargo/bin:/usr/local/bin:/root/.bun/bin:${PATH}"

RUN printf 'retry = 3\nretry-delay = 2\nretry-connrefused\nretry-all-errors\n' > /root/.curlrc \
	&& printf 'Acquire::Retries "3";\n' > /etc/apt/apt.conf.d/80-retries

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

ARG RUNNER_HTTPS_PROXY

RUN export HTTPS_PROXY=$RUNNER_HTTPS_PROXY && \
	curl -fsSL https://bun.com/install | bash -s "bun-v1.3.13"; \
	bun --version

RUN export HTTPS_PROXY=$RUNNER_HTTPS_PROXY && \
	curl -fsSL -o /usr/local/bin/n https://raw.githubusercontent.com/tj/n/master/bin/n && \
	chmod +x /usr/local/bin/n && \
	n install stable && \
	n install 23 && \
	n install 20
