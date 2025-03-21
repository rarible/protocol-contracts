#!/usr/bin/env bash

# <ai_context>
# sh/transferNft.sh
# Example shell script for running transferNft.ts with sample parameters.
# Adjust the parameters below as needed for your own environment.
# </ai_context>

echo "Transferring NFT..."

npx hardhat transferNft \
  --token-address "0x000000000000000000000000000000000057C327" \
  --to "0xfb571F9da71D1aC33E069571bf5c67faDCFf18e4" \
  --token-id "1" \
  --do-associate true \
  --gas-limit 6000000 \
  --network testnet