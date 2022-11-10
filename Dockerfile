FROM node:14.18.2 as base
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

FROM base as locking
WORKDIR /protocol/locking
RUN rm -rf build
ENTRYPOINT ["truffle", "test", "--compile-all"]