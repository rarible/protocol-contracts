#!/usr/bin/env bash
# <ai_context>
# sh-examples/listBuyNft.sh
# Example shell script to list and buy NFT tokens using the listBuyNft task
# </ai_context>
# 6, 7

echo "Listing and buying NFT token..."
npx hardhat listBuyNft \
  --exchange "0xdD34aBb3c4ADb5Bd5bde5743AA32A5aA63424cEb" \
  --nft "0x000000000000000000000000000000000057C327" \
  --token-id "8" \
  --price "100000000" \
  --network testnet