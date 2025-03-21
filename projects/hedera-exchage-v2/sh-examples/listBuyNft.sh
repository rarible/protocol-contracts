#!/usr/bin/env bash
# <ai_context>
# sh-examples/listBuyNft.sh
# Example shell script to list and buy NFT tokens using the listBuyNft task
# </ai_context>

echo "Listing and buying NFT token..."
npx hardhat listBuyNft \
  --exchange "0xExchangeAddress" \
  --nft "0xNFTAddress" \
  --tokenId "1" \
  --price "1000000000000000000" \
  --sellerIndex "0" \
  --buyerIndex "1" \
  --network testnet