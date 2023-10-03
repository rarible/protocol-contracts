set -e
npm install -g truffle@5.4.7
yarn run bootstrap
yarn run clean
yarn run build:deploy