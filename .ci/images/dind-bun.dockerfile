ARG CI_DEPENDENCY_PROXY_GROUP_IMAGE_PREFIX=docker.io

FROM ${CI_DEPENDENCY_PROXY_GROUP_IMAGE_PREFIX}/docker:28.5.1-dind
 
RUN apk add git curl bash libstdc++ libgcc gcompat

ENV PATH="/root/.bun/bin:${PATH}"

RUN curl -fsSL https://bun.com/install | bash && \
    bun --version
