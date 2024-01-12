FROM mcr.microsoft.com/playwright:v1.40.0-jammy

WORKDIR /src/e2e

COPY tsconfig.json ..
COPY e2e/package*.json .
RUN [ "npm", "ci" ]

COPY e2e .

ARG URL GX_E2E_GITLAB_TOKEN
ENV CI 1

CMD [ "npm", "run", "test" ]
