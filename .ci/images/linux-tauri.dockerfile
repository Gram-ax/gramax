ARG CI_DEPENDENCY_PROXY_GROUP_IMAGE_PREFIX=docker.io

FROM ${CI_DEPENDENCY_PROXY_GROUP_IMAGE_PREFIX}/ubuntu:jammy

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

RUN curl https://sh.rustup.rs -sSf > /tmp/rustup-init.sh \
	&& chmod +x /tmp/rustup-init.sh \
	&& sh /tmp/rustup-init.sh -y \
	&& rm -rf /tmp/rustup-init.sh

RUN curl -fsSL https://bun.com/install | bash && \
	curl -fsSL https://raw.githubusercontent.com/tj/n/master/bin/n | bash -s v23


ENV PATH="/root/.bun/bin:/root/.cargo/bin:${PATH}"

RUN rustup target add x86_64-unknown-linux-gnu
RUN cargo install tauri-cli
