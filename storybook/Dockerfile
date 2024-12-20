FROM gitlab.ics-it.ru:4567/ics/doc-reader:base-image-${BRANCH:-"develop"} AS deps
WORKDIR /src
COPY . .
RUN rm -r services/*
RUN ./install-deps.sh --ci

FROM deps AS build
ENV NODE_OPTIONS=--max_old_space_size=4096
WORKDIR /src/storybook
RUN npm run build

FROM gitlab.ics-it.ru:4567/ics/doc-reader:warp-spa
WORKDIR /app
ENV PORT=80
EXPOSE 80
COPY --from=build /src/storybook/storybook-static .
CMD [ "warp-spa" ]
