set -e
yarn run bootstrap
yarn run build:deploy
yarn run build:exchange-v2
yarn run build:exchange-wrapper