#!/usr/bin/env bash
# <ai_context>
# sh-examples/listBuyWithERC20.sh
# Example shell script to list and buy NFT tokens with ERC20 payment using the listBuyWithERC20 task
# </ai_context>

echo "Listing and buying NFT token with ERC20 payment..."
npx hardhat listBuyWithERC20 \
  --exchange "0xExchangeAddress" \
  --nft "0xNFTAddress" \
  --tokenId "1" \
  --price "1000000000000000000" \
  --erc20 "0xERC20Address" \
  --sellerIndex "0" \
  --buyerIndex "1" \
  --network testnet