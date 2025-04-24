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


<!--
kroma done -- need more fund
4:03
alephzero done
4:04
shape done
4:05
telos done
4:06
eth done


Vadim Fadeev
  4:07 PM
0.08227252444
4:07
eth
4:07
oe


Kirill Timofeev
:spiral_calendar_pad:  4:08 PM
bera done
4:09
abstract done
4:09
arbitrum done
4:11
matchain done
4:12
goat done