FROM gitlab.ics-it.ru:4567/ics/doc-reader:base-image as deps

WORKDIR /src

COPY . .

RUN rm -r services/*

RUN ./install-deps.sh --ci --wasm

FROM deps as build

ENV NODE_OPTIONS=--max_old_space_size=4096

WORKDIR /src/storybook

RUN npm run build

FROM devforth/spa-to-http:latest

WORKDIR /app

ENV PORT=80
EXPOSE 80

COPY --from=build /src/storybook/storybook-static .

CMD [ "go-http-serve", "--spa", "false" ]
