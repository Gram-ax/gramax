ARG NEXUS_DOCKERHUB

FROM ${NEXUS_DOCKERHUB}/docker:29.4.1-dind

RUN printf 'retry = 3\nretry-delay = 2\nretry-connrefused\nretry-all-errors\n' > /root/.curlrc

RUN ALPINE_BRANCH="v$(cut -d. -f1,2 /etc/alpine-release)" && \
	echo "https://mirror.yandex.ru/mirrors/alpine/${ALPINE_BRANCH}/main"      >  /etc/apk/repositories && \
	echo "https://mirror.yandex.ru/mirrors/alpine/${ALPINE_BRANCH}/community" >> /etc/apk/repositories && \
	apk add --no-cache git curl bash libstdc++ libgcc gcompat jq cosign ca-certificates && \
	update-ca-certificates

ARG RUNNER_HTTPS_PROXY

RUN export HTTPS_PROXY=$RUNNER_HTTPS_PROXY && \
	curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin

ENV PATH="/root/.bun/bin:${PATH}"

RUN export HTTPS_PROXY=$RUNNER_HTTPS_PROXY && \
	curl -fsSL https://bun.com/install | bash && \
	bun --version
