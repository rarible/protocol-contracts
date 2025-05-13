FROM node:20.18.3 as base
WORKDIR /protocol
RUN npm install -g truffle
COPY . .
RUN yarn install
RUN yarn build

FROM base as deploy
WORKDIR /protocol/deploy
ENTRYPOINT ["truffle", "test", "--compile-all"]

FROM base as exchange-v2
WORKDIR /protocol/exchange-v2
ENTRYPOINT ["truffle", "test", "--compile-all"]
