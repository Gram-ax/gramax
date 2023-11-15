FROM node:18-alpine

WORKDIR /app/reader
ENV ROOT_PATH /app/docs
ENV PORT 80
ENV PRODUCTION true
ENV SUBMODULE_BRANCH_NAME ${SUBMODULE_BRANCH_NAME}

RUN apk add --no-cache \
	nss \
	freetype \
	freetype-dev \
	harfbuzz \
	ca-certificates \
	ttf-freefont \
	bash \
	git \
	yarn

COPY . .

RUN node -v && \
	npm -v && \
    npm ci && \
    npm run build:correctDnd && \
    npm run build:fn-schemes && \
	cd next && \
	npm ci && \
	cd .. 
	
RUN cd ./logic/Markdown/Parser && \
	git clone https://github.com/Sats365/MarkdocInclude.git ./Markdoc && \
	cd ./Markdoc && \
	git checkout ${SUBMODULE_BRANCH_NAME} && \
	cd ../../ && \
	cd ./Wysiwyg && \
	git clone https://github.com/Sats365/ProsemirrorMarkdownParser.git ./Prosemirror && \
	cd ./Prosemirror && \
	git checkout ${SUBMODULE_BRANCH_NAME}

RUN cd storybook && \
    npm ci --legacy-peer-deps && \
	npm run build

WORKDIR /app/reader/storybook
CMD ["npm", "start"]
