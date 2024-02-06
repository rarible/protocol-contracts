# * Deprecated migration in truffle
# Current migrations are in [hardhat-deploy/](../hardhat-deploy/) package
## Rarible full migration
- to enable migration for legacy contracts set property 
    - ```deploy_legacy: true```

    - for exchangev1 set:
        ```
        beneficiary: "",
        buyerFeeSigner: "",
        ```

    - for rarible legacy token set
        ```
        "rarible_token_legacy": {
            name: "Rarible",
            symbol: "RARI",
            signer: "0x002ed05478c75974e08f0811517aa0e3eddc1380",
            contractURI: "https://api-e2e.rarible.com/contractMetadata/{address}",
            tokenURIPrefix: "ipfs://",
        },
        ```
    - for mintable legacy token set
        ```
        "mintable_token_legacy": {
            name: "Rarible",
            symbol: "RARI",
            newOwner: "0x002ed05478c75974e08f0811517aa0e3eddc1380",
            contractURI: "https://api-e2e.rarible.com/contractMetadata/{address}",
            tokenURIPrefix: "ipfs://",
        },
        ```
    for the desired network's settings in [config.js](./migrations/config.js)

