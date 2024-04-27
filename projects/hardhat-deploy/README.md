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

salt used DETERMENISTIC_DEPLOYMENT_SALT=0x1115