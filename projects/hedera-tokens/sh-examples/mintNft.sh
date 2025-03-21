#!/usr/bin/env bash

# <ai_context>
# sh/mintNft.sh
# Example shell script for running mintNft.ts with sample parameters.
# Adjust the parameters below as needed for your own environment.
# </ai_context>

echo "Minting NFT..."

npx hardhat mintNft \
  --collection-address "0x000000000000000000000000000000000057C327" \
  --gas-limit 4000000 \
  --network testnet