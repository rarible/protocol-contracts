#!/usr/bin/env bash

# <ai_context>
# sh/mintNft.sh
# Example shell script for running mintNft.ts with sample parameters.
# Adjust the parameters below as needed for your own environment.
# </ai_context>

echo "Minting NFT..."

npx ts-node scripts/mintNft.ts \
  --collectionAddress "0x0000000000000000000000000000000000COLLE" \
  --gasLimit 4000000 \
  --network testnet