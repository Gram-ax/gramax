FROM mcr.microsoft.com/playwright:v1.34.0-jammy

WORKDIR /app

RUN apt-get update && apt-get install -y \
  libnss3 \
  libfreetype6 \
  libfreetype6-dev \
  libharfbuzz0b \
  ca-certificates \
  fonts-freefont-ttf \
  bash \
  git \
  fd-find \
  yarn \
  netcat \
  libstdc++6 && \
  apt-get clean && \
  rm -rf /var/lib/apt/lists/*

COPY . .

RUN node -v && \
  npm -v && \
  npm i -f && \
  npm run build:schemes

WORKDIR /app/target/browser

RUN npm i -f

WORKDIR /app/e2e/runner

RUN npm i -f && \
  npx playwright install firefox 

WORKDIR /app

RUN npm run test:e2e