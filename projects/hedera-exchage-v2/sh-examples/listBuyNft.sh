#!/usr/bin/env bash
# <ai_context>
# sh-examples/listBuyNft.sh
# Example shell script to list and buy NFT tokens using the listBuyNft task
# </ai_context>
# 6, 7

echo "Listing and buying NFT token..."
npx hardhat listBuyNft \
  --exchange "0xAA8ee5bCcA0f23deCf53Ac685f273E76Fede7fFA" \
  --nft "0x000000000000000000000000000000000057C327" \
  --token-id "8" \
  --price "100000000" \
  --network testnet