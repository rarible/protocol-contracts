#!/usr/bin/env bash

# <ai_context>
# sh/verify721.sh
# Example shell script for running verify721.ts with sample parameters.
# Adjust the parameters below as needed for your own environment.
# </ai_context>

echo "Verifying ERC721 Contract..."

npx ts-node scripts/verify721.ts \
  --collectionAddress "0x0000000000000000000000000000000000COLLE" \
  --tokenId "1" \
  --to "0x0000000000000000000000000000000000RECEIVE" \
  --operator "0x0000000000000000000000000000000000OPERATOR" \
  --gasLimit 4000000 \
  --network testnet