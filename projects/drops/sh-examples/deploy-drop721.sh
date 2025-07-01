npx hardhat deploy-drop721 --network polygon_mainnet \
    --default-admin 0xb3D6b3e65C39C5C3c7434a27542912C4600e9910 \
    --name "DROP Test 721" \
    --symbol "DRP721" \
    --contract-uri "ipfs://QmdHaufjUDJgbZzZ4eFCjtJQyeQpuNwoEvqLm5rq159vC8/5" \
    --sale-recipient 0xfb571F9da71D1aC33E069571bf5c67faDCFf18e4 \
    --royalty-recipient 0xfb571F9da71D1aC33E069571bf5c67faDCFf18e4 \
    --royalty-bps 500 \
    --platform-fee-bps 200 \
    --platform-fee-recipient 0xfb571F9da71D1aC33E069571bf5c67faDCFf18e4 \
    --salt 0x0000000000000000000000000000000000000000000000000000000000000001 \
    --extra-data 0x \
    --clone-factory 0x9A611f52a1b8007B1A20935ba619352C694fAE8F \
    --implementation 0xAe7c9D8BE532DAE56cdaacD9f91D17243CB8a91E


    
npx hardhat deploy-drop721 --network megaeth_testnet \
    --default-admin 0x98556b192f8304001986e0bb94e61e51049a600c \
    --name "DROP Test 721" \
    --symbol "DRP721" \
    --contract-uri "ipfs://QmdHaufjUDJgbZzZ4eFCjtJQyeQpuNwoEvqLm5rq159vC8/5" \
    --sale-recipient 0x98556b192f8304001986e0bb94e61e51049a600c \
    --royalty-recipient 0x98556b192f8304001986e0bb94e61e51049a600c \
    --royalty-bps 500 \
    --platform-fee-bps 200 \
    --platform-fee-recipient 0x98556b192f8304001986e0bb94e61e51049a600c \
    --salt 0x0000000000000000000000000000000000000000000000000000000000000001 \
    --extra-data 0x \
    --clone-factory 0x9A611f52a1b8007B1A20935ba619352C694fAE8F \
    --implementation 0xAe7c9D8BE532DAE56cdaacD9f91D17243CB8a91E