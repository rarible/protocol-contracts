set -e
yarn
yarn run bootstrap
yarn run clean
yarn run build:deploy