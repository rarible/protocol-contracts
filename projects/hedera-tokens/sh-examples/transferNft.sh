#!/usr/bin/env bash

# <ai_context>
# sh/transferNft.sh
# Example shell script for running transferNft.ts with sample parameters.
# Adjust the parameters below as needed for your own environment.
# </ai_context>

echo "Transferring NFT..."

npx ts-node scripts/transferNft.ts \
  --tokenAddress "0x0000000000000000000000000000000000NFT123" \
  --to "0x0000000000000000000000000000000000RECEIVE" \
  --tokenId "1" \
  --associate true \
  --gasLimit 6000000 \
  --network testnet