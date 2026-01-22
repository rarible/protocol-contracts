#!/bin/bash

# Deploy OpenEditionERC721C (Creator Token version)
# This version does NOT have platform fee parameters

# Example for Base mainnet
npx hardhat deploy-oe-c --network base \
    --default-admin 0xA95a09520AF0f1BBEf810a47560C79Affe75AA9f \
    --name "Open Edition ERC721C" \
    --symbol "OpenEditionERC721C" \
    --contract-uri "ipfs://QmdHaufjUDJgbZzZ4eFCjtJQyeQpuNwoEvqLm5rq159vC8/6" \
    --sale-recipient 0xA95a09520AF0f1BBEf810a47560C79Affe75AA9f \
    --royalty-recipient 0xA95a09520AF0f1BBEf810a47560C79Affe75AA9f \
    --royalty-bps 500 \
    --salt 0x0000000000000000000000000000000000000000000000000000000000000001 \
    --extra-data 0x \
    --clone-factory 0x25548Ba29a0071F30E4bDCd98Ea72F79341b07a1 \
    --implementation 0x148c38dC5547E320Ac4A36cd3Bf32aB01CB141B9

# Example for MegaETH
npx hardhat deploy-oe-c --network megaeth \
    --default-admin 0xA95a09520AF0f1BBEf810a47560C79Affe75AA9f \
    --name "Open Edition ERC721C" \
    --symbol "OpenEditionERC721C" \
    --contract-uri "ipfs://QmdHaufjUDJgbZzZ4eFCjtJQyeQpuNwoEvqLm5rq159vC8/6" \
    --sale-recipient 0xA95a09520AF0f1BBEf810a47560C79Affe75AA9f \
    --royalty-recipient 0xA95a09520AF0f1BBEf810a47560C79Affe75AA9f \
    --royalty-bps 500 \
    --salt 0x0000000000000000000000000000000000000000000000000000000000000001 \
    --extra-data 0x \
    --clone-factory 0x72B38294ef7BB2Fb219a89c09026dEBCaD8A656E \
    --implementation 0x6F9C896cd722f09D1CF4F767E7981DDe7C734959
