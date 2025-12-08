FROM --platform=$TARGETPLATFORM mcr.microsoft.com/playwright:v1.56.1-noble

RUN apt-get update && apt-get upgrade -y && \
  apt-get install -y \
  git \
  make \
  unzip \
  curl \
  pkg-config \
  build-essential \
  git

RUN rm -rf /var/lib/apt/lists/* && \
  apt-get clean

RUN curl -fsSL https://bun.com/install | bash

RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y

ENV PATH="/root/.bun/bin:/root/.cargo/bin:/emsdk:/emsdk/upstream/emscripten:${PATH}" \
  EMSDK="/emsdk" \
  EMSDK_NODE="/emsdk/node/16.20.0_64bit/bin/node"

RUN rustup toolchain install nightly && \
  rustup +nightly component add rust-src && \
  rustup +nightly target add wasm32-unknown-emscripten

RUN git clone https://github.com/emscripten-core/emsdk.git && \
  cd emsdk && \
  ./emsdk install latest && \
  ./emsdk activate latest

RUN touch x.c && \
  emcc x.c -sUSE_ZLIB=1 -o /dev/null

RUN git config --global url.ssh://git@github.com/.insteadOf https://github.com/

COPY .ci/github-private-key /root/.ssh/
RUN ssh-keyscan github.com > /root/.ssh/known_hosts && \
  printf "Host github.com\nPreferredAuthentications publickey\nUser git\nIdentityFile /root/.ssh/github-private-key\n" > /root/.ssh/config && \
  chmod -R 700 /root/.ssh && chmod 600 /root/.ssh/config && \
  ssh -T git@github.com || echo "Ssh auth to github"

RUN curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc && chmod a+r /etc/apt/keyrings/docker.asc && \
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}") stable" > /etc/apt/sources.list.d/docker.list && \
  apt-get update && apt-get install -y docker-ce-cli docker-compose-plugin

WORKDIR /src

COPY . .

RUN cargo install --path crates/spa && \
    rm -rf /src/**/*
