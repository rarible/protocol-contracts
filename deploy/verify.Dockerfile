FROM node:14.18.2 as base
WORKDIR /protocol
RUN npm install -g truffle@5.4.17
COPY . .
RUN yarn install
RUN yarn bootstrap
ENV NETWORK=polygon_mumbai
ENV POLYGONSCAN_API_KEY=""
ENV ETHERSCAN_API_KEY=""
WORKDIR /protocol/deploy
ENTRYPOINT truffle run verify RariMineV3 Staking --network ${NETWORK}