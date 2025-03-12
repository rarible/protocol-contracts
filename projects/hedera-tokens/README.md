# Hardhat Deploy

Network config must be created in [config folder](./utils/config/) for deployment

## Deployment

For a fresh deployment of the entire test suite on a new chain, use:

```shell
npx hardhat deploy --network <network_name> --tags all
```

For individual deployments:

```shell
npx hardhat deploy --network <network_name>
```

## Contract Verification

Different chains use different verification methods:

### For Etherscan-compatible chains (Ethereum, BSC, Polygon, etc.):

```shell
npx hardhat --network <network_name> etherscan-verify [--api-key <etherscan-apikey>] [--api-url <url>]
```

### For Sourcify-compatible chains (Telos, etc.):

```shell
npx hardhat --network <network_name> sourcify
```

### Verification Support by Chain:

- Etherscan API:
  - Ethereum (Mainnet & testnets)
  - BSC
  - Polygon
  - Avalanche
  - (and other chains using Etherscan-compatible explorers)
- Sourcify:
  - Telos
  - (other chains that don't support Etherscan API)

### Generate Deployment Document

After verification, generate a list of deployed contracts and their addresses:

```shell
NETWORK="network-name" bash export-address-to-readme.bash
```

## Testing

To run integration tests of contracts to deploy:

```shell
npx hardhat test
```
