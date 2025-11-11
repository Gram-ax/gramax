ARG CI_DEPENDENCY_PROXY_GROUP_IMAGE_PREFIX=docker.io
FROM ${CI_DEPENDENCY_PROXY_GROUP_IMAGE_PREFIX}/rust:1.91-slim-bookworm

SHELL ["/bin/bash","-euo","pipefail","-c"]

ARG TARGETARCH
ARG KUBECTL_VERSION="v1.33.0"

RUN apt-get update && apt-get install -y --no-install-recommends \
      bash curl ca-certificates gettext jq coreutils gpg apt-transport-https \
 && update-ca-certificates \
 && curl -fsSL https://packages.buildkite.com/helm-linux/helm-debian/gpgkey | gpg --dearmor | tee /usr/share/keyrings/helm.gpg > /dev/null \
 && echo "deb [signed-by=/usr/share/keyrings/helm.gpg] https://packages.buildkite.com/helm-linux/helm-debian/any/ any main" | tee /etc/apt/sources.list.d/helm-stable-debian.list \
 && apt-get update && apt-get install -y --no-install-recommends helm \
 && curl -fsSLo /usr/local/bin/kubectl "https://dl.k8s.io/release/${KUBECTL_VERSION}/bin/linux/amd64/kubectl" \
 && chmod +x /usr/local/bin/kubectl \
 && curl -fsSLo /usr/local/bin/mc "https://dl.min.io/client/mc/release/linux-amd64/mc" \
 && chmod +x /usr/local/bin/mc \
 && apt-get clean && rm -rf /var/lib/apt/lists/*

CMD ["/bin/bash"]
