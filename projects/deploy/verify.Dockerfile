FROM node:14.18.2 as baseverify
WORKDIR /protocol
RUN npm install -g truffle@5.4.17
RUN apt-get update
RUN apt-get install -y jq

FROM baseverify as rariverify
ENV NETWORK=polygon_mumbai
ENV POLYGONSCAN_API_KEY=""
ENV ETHERSCAN_API_KEY=""
COPY . .
RUN yarn install
RUN yarn bootstrap
WORKDIR /protocol/deploy
ENTRYPOINT ./verify-all.bash