ARG CI_DEPENDENCY_PROXY_GROUP_IMAGE_PREFIX=docker.io

FROM --platform=$TARGETPLATFORM ${CI_DEPENDENCY_PROXY_GROUP_IMAGE_PREFIX}/ubuntu:jammy

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

RUN curl -LO https://github.com/oven-sh/bun/releases/download/bun-v1.2.23/bun-linux-x64-baseline.zip; unzip -j bun-linux-x64-baseline.zip 'bun-linux-x64-baseline/bun' -d /usr/local/bin; rm bun-linux-x64-baseline.zip; \
  curl -fsSL https://raw.githubusercontent.com/tj/n/master/bin/n | bash -s v23


ENV PATH="/root/.bun/bin:/root/.cargo/bin:${PATH}"

RUN rustup target add x86_64-unknown-linux-gnu
RUN cargo install tauri-cli

RUN git config --global url.ssh://git@github.com/.insteadOf https://github.com/

COPY .ci/github-private-key /root/.ssh/
RUN ssh-keyscan github.com > /root/.ssh/known_hosts && \
  printf "Host github.com\nPreferredAuthentications publickey\nUser git\nIdentityFile /root/.ssh/github-private-key\n" > /root/.ssh/config && \
  chmod -R 700 /root/.ssh && chmod 600 /root/.ssh/config