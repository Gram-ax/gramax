ARG NEXUS_DOCKERHUB

FROM ${NEXUS_DOCKERHUB}/debian:bookworm-slim

ARG TARGETARCH=amd64
ARG GLAB_VERSION=1.101.0
ARG GH_VERSION=2.93.0
ARG RUNNER_HTTPS_PROXY

ENV HTTPS_PROXY=${RUNNER_HTTPS_PROXY}

ENV PATH="/root/.local/bin:/root/.bun/bin:${PATH}"

RUN printf 'retry = 3\nretry-delay = 2\nretry-connrefused\nretry-all-errors\n' > /root/.curlrc \
	&& printf 'Acquire::Retries "3";\n' > /etc/apt/apt.conf.d/80-retries

RUN apt-get update && \
	apt-get install -y --no-install-recommends \
		git curl ca-certificates jq bash unzip openssh-client ripgrep fd-find python3 && \
	rm -rf /var/lib/apt/lists/* && \
	ln -s "$(command -v fdfind)" /usr/local/bin/fd

RUN curl -sSL "https://gitlab.com/gitlab-org/cli/-/releases/v${GLAB_VERSION}/downloads/glab_${GLAB_VERSION}_linux_${TARGETARCH}.tar.gz" \
	| tar -xz -C /usr/local/bin --strip-components=1 bin/glab && \
	glab --version

RUN curl -sSL "https://github.com/cli/cli/releases/download/v${GH_VERSION}/gh_${GH_VERSION}_linux_${TARGETARCH}.tar.gz" \
	| tar -xz -C /usr/local/bin --strip-components=2 "gh_${GH_VERSION}_linux_${TARGETARCH}/bin/gh" && \
	gh --version

RUN curl -LsSf https://astral.sh/uv/install.sh | sh

RUN curl -fsSL https://bun.com/install | bash

RUN curl -fsSL https://claude.ai/install.sh | bash
