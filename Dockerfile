ARG BASE_IMAGE_VERSION=20.18.3-bullseye
FROM node:${BASE_IMAGE_VERSION} AS base

FROM base AS base-dev

WORKDIR /app

RUN apt-get update -y \
 && apt-get install -y --no-install-recommends \
      ca-certificates curl gnupg jq git \
 && npm install -g truffle@5.11.5 \
 && rm -rf /var/{lib/apt,lib/dpkg/info,cache,log}/*

# ---- Foundry ----
RUN curl -L https://foundry.paradigm.xyz | bash \
 && /root/.foundry/bin/foundryup \
 && install -Dm755 /root/.foundry/bin/* /usr/local/bin \
 && rm -rf /root/.foundry

ENV PATH="/usr/local/bin:${PATH}"

COPY . .
RUN yarn install
RUN yarn build
RUN yarn test

# FROM base as deploy
# WORKDIR /protocol/deploy
# ENTRYPOINT ["truffle", "test", "--compile-all"]

# FROM base as exchange-v2
# WORKDIR /protocol/exchange-v2
# ENTRYPOINT ["truffle", "test", "--compile-all"]
