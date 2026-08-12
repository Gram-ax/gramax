ARG NEXUS_DOCKERHUB

FROM ${NEXUS_DOCKERHUB}/ubuntu:jammy

RUN printf 'retry = 3\nretry-delay = 2\nretry-connrefused\nretry-all-errors\n' > /root/.curlrc \
	&& printf 'Acquire::Retries "3";\n' > /etc/apt/apt.conf.d/80-retries

RUN  apt-get update && apt-get install -y \
	wget \
	git \
	unzip \
	llvm \
	curl \
	cmake \
	libharfbuzz-dev \
	libfribidi-dev \
	libpango1.0-dev \
	librsvg2-dev \
	libgtk-3-dev \
	libsoup-3.0-dev \
	libappindicator3-dev \
	libwebkit2gtk-4.1-dev \
	libjavascriptcoregtk-4.1-dev \
	patchelf \
	xdg-utils \
	libatk1.0-dev \
	file \
	imagemagick \
	coreutils

RUN ln -sf $(which convert) /usr/bin/magick

ARG RUNNER_HTTPS_PROXY

RUN export HTTPS_PROXY=$RUNNER_HTTPS_PROXY && \
	curl https://sh.rustup.rs -sSf > /tmp/rustup-init.sh && \
	chmod +x /tmp/rustup-init.sh && \
	sh /tmp/rustup-init.sh -y && \
	rm -rf /tmp/rustup-init.sh

RUN export HTTPS_PROXY=$RUNNER_HTTPS_PROXY && \
	curl -fsSL https://bun.com/install | bash && \
	curl -fsSL https://raw.githubusercontent.com/tj/n/master/bin/n | bash -s v23


ENV PATH="/root/.bun/bin:/root/.cargo/bin:${PATH}"

RUN export HTTPS_PROXY=$RUNNER_HTTPS_PROXY && \
	rustup target add x86_64-unknown-linux-gnu

RUN export HTTPS_PROXY=$RUNNER_HTTPS_PROXY && \
	cargo install tauri-cli
