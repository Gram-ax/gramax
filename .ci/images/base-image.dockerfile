ARG CI_DEPENDENCY_PROXY_GROUP_IMAGE_PREFIX=docker.io

FROM --platform=$TARGETPLATFORM ${CI_DEPENDENCY_PROXY_GROUP_IMAGE_PREFIX}/rust:1.91-bookworm

RUN apt-get update && \ 
  apt-get install -y \
  git \
  curl \
  make \
  cmake \
  unzip \
  python3 \
  pkg-config \
  build-essential \
  fontconfig \
  libfontconfig1 \
  imagemagick 

RUN set -eux; \
    curl -fsSL "https://github.com/oven-sh/bun/releases/download/bun-v1.2.23/bun-linux-x64-baseline.zip" -o /tmp/bun.zip; \
    unzip -q /tmp/bun.zip -d /tmp; \
    install -m 0755 /tmp/bun-*/bun /usr/local/bin/bun; \
    rm -rf /tmp/bun.zip /tmp/bun-*; \
    bun --version

RUN curl -fsSL https://raw.githubusercontent.com/tj/n/master/bin/n | bash -s v23 
  
ENV PATH="/root/.cargo/bin:/usr/local/bin:${PATH}"

RUN git config --global url.ssh://git@github.com/.insteadOf https://github.com/

COPY .ci/github-private-key /root/.ssh/

RUN ssh-keyscan github.com > /root/.ssh/known_hosts && \
  printf "Host github.com\nPreferredAuthentications publickey\nUser git\nIdentityFile /root/.ssh/github-private-key\n" > /root/.ssh/config && \
  chmod -R 700 /root/.ssh && chmod 600 /root/.ssh/config
