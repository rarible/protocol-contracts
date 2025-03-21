#!/usr/bin/env bash
# <ai_context>
# sh-examples/listBuyNft.sh
# Example shell script to list and buy NFT tokens using the listBuyNft task
# </ai_context>
# 6, 7

echo "Listing and buying NFT token..."
npx hardhat listBuyNft \
  --exchange "0xE6C19FC3eC90Dc0a85C9B278B2fa730ae863f7Ea" \
  --nft "0x000000000000000000000000000000000057C327" \
  --token-id "6" \
  --price "100000000" \
  --seller-index "0" \
  --buyer-index "1" \
  --network testnet