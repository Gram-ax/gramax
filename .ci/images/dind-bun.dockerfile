ARG CI_DEPENDENCY_PROXY_GROUP_IMAGE_PREFIX=docker.io

FROM ${CI_DEPENDENCY_PROXY_GROUP_IMAGE_PREFIX}/docker:29.4.1-dind

RUN ALPINE_BRANCH="v$(cut -d. -f1,2 /etc/alpine-release)" && \
	echo "https://mirror.yandex.ru/mirrors/alpine/${ALPINE_BRANCH}/main"      >  /etc/apk/repositories && \
	echo "https://mirror.yandex.ru/mirrors/alpine/${ALPINE_BRANCH}/community" >> /etc/apk/repositories && \
	apk add --no-cache git curl bash libstdc++ libgcc gcompat jq cosign && \
	curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin

ENV PATH="/root/.bun/bin:${PATH}"

RUN curl -fsSL https://bun.com/install | bash && \
	bun --version
