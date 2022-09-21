FROM node:12.22.5 as base
WORKDIR /protocol
RUN npm install -g truffle@5.4.17
COPY . .
RUN yarn install
RUN yarn bootstrap

FROM base as deploy
WORKDIR /protocol/deploy
ENTRYPOINT ["truffle", "test", "--compile-all"]

FROM base as exchange-v2
WORKDIR /protocol/exchange-v2
ENTRYPOINT ["truffle", "test", "--compile-all"]
