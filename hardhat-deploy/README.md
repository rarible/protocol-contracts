# Hardhat Deploy

Network config must be created in [config folder](./utils/config/) for deployment

to deploy run:
```shell
npx hardhat deploy --network <network_name>
```

to verify after deploy run:
```shell
npx hardhat --network mainnet etherscan-verify [--api-key <etherscan-apikey>] [--api-url <url>]
```

to do integration tests of contracts to deploy:
```shell
npx hardhat test
```


requires forge 0.2.0 (6fc7463 2024-01-05T00:17:41.668342000Z)

https://book.getfoundry.sh/getting-started/installation

please check installation:
```shell
curl -L https://foundry.paradigm.xyz | bash
```