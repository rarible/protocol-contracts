npx hardhat deploy-oe --network polygon_mainnet \
    --default-admin 0xb3D6b3e65C39C5C3c7434a27542912C4600e9910 \
    --name "MyCollection" \
    --symbol "MYC" \
    --contract-uri "ipfs://QmdHaufjUDJgbZzZ4eFCjtJQyeQpuNwoEvqLm5rq159vC8/6" \
    --sale-recipient 0xfb571F9da71D1aC33E069571bf5c67faDCFf18e4 \
    --royalty-recipient 0xfb571F9da71D1aC33E069571bf5c67faDCFf18e4 \
    --royalty-bps 500 \
    --platform-fee-bps 200 \
    --platform-fee-recipient 0xfb571F9da71D1aC33E069571bf5c67faDCFf18e4 \
    --salt 0x0000000000000000000000000000000000000000000000000000000000000001 \
    --extra-data 0x \
    --clone-factory 0x25548ba29a0071f30e4bdcd98ea72f79341b07a1 \
    --implementation 0x1e1b6e13f0eb4c570628589e3c088bc92ad4db45


# megaeth

0x7d47126a2600E22eab9eD6CF0e515678727779A6

npx hardhat deploy-oe --network megaeth_testnet \
    --default-admin 0x98556b192f8304001986e0bb94e61e51049a600c \
    --name "MyCollection" \
    --symbol "MYC" \
    --contract-uri "ipfs://QmdHaufjUDJgbZzZ4eFCjtJQyeQpuNwoEvqLm5rq159vC8/6" \
    --sale-recipient 0x98556b192f8304001986e0bb94e61e51049a600c \
    --royalty-recipient 0x98556b192f8304001986e0bb94e61e51049a600c \
    --royalty-bps 500 \
    --platform-fee-bps 200 \
    --platform-fee-recipient 0x98556b192f8304001986e0bb94e61e51049a600c \
    --salt 0x0000000000000000000000000000000000000000000000000000000000000001 \
    --extra-data 0x \
    --clone-factory 0x25548ba29a0071f30e4bdcd98ea72f79341b07a1 \
    --implementation 0x7d47126a2600E22eab9eD6CF0e515678727779A6