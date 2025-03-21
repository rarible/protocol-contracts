#!/usr/bin/env bash
# <ai_context>
# sh-examples/cancelOrder.sh
# Example shell script to cancel an order using the cancelOrder task
# </ai_context>

echo "Cancelling order..."
npx hardhat cancelOrder \
  --exchange "0xExchangeAddress" \
  --order '{"maker":"0xMakerAddress","makeAsset":{"assetType":{"assetClass":"0x...","data":"0x..."},"value":"1"},"taker":"0x0000000000000000000000000000000000000000","takeAsset":{"assetType":{"assetClass":"0x...","data":"0x..."},"value":"1000000000000000000"},"salt":"123456789","start":0,"end":0,"dataType":"0x...","data":"0x..."}' \
  --signerIndex "0" \
  --network testnet