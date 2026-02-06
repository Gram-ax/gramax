ARG BRANCH
FROM --platform=$TARGETPLATFORM gitlab.ics-it.ru:4567/ics/doc-reader:spa-$BRANCH AS spa

FROM --platform=$TARGETPLATFORM mcr.microsoft.com/playwright:v1.57.0-noble

RUN apt-get update && apt-get upgrade -y && \
	apt-get install -y \
	git \
	make \
	unzip \
	curl \
	pkg-config \
	build-essential \
	git && \
	rm -rf /var/lib/apt/lists/* && \
	apt-get clean

RUN curl -fsSL https://bun.com/install | bash && \
	curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y && \
	curl -fsSL -o /usr/local/bin/n https://raw.githubusercontent.com/tj/n/master/bin/n && \
	chmod +x /usr/local/bin/n && \
	n install stable && \
	n install 20 && \
	n use stable

ENV PATH="/root/.bun/bin:/root/.cargo/bin:${PATH}"

ARG GITHUB_ANTI_RATELIMIT_SSH_KEY
RUN --mount=type=secret,id=GITHUB_ANTI_RATELIMIT_SSH_KEY,dst=/root/.ssh/github-private-key,required=false \
	if [ -s /root/.ssh/github-private-key ]; then \
	ssh-keyscan github.com > /root/.ssh/known_hosts && \
	printf "Host github.com\n  PreferredAuthentications publickey\n  User git\n  IdentityFile /root/.ssh/github-private-key\n" > /root/.ssh/config && \
	chmod -R 700 /root/.ssh && chmod 600 /root/.ssh/config && \
	ssh -T git@github.com || echo "Ssh auth to github"; \
	fi

RUN curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc && chmod a+r /etc/apt/keyrings/docker.asc && \
	echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
	$(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}") stable" > /etc/apt/sources.list.d/docker.list && \
	apt-get update && apt-get install -y docker-ce-cli docker-compose-plugin

COPY --from=spa /usr/bin/spa /usr/bin/spa
