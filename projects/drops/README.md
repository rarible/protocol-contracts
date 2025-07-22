# Hardhat Deploy Tokens

This project contains token contract deployments for the Rarible Protocol, including ERC721 and ERC1155 implementations.

Network config must be created in [config folder](./utils/config/) for deployment.

## Quick Start

```shell
# Install dependencies and compile
yarn install
npx hardhat compile

# Deploy to all supported networks
npx hardhat deploy --network <network_name> --tags all
```

## Deployment

### Deploy All Token Contracts

For a fresh deployment of the entire token suite on a new chain, use:

```shell
npx hardhat deploy --network <network_name> --tags all
```

### Deploy Specific Contracts

For individual token contract deployments:

```shell
# Deploy only ERC721 contracts
npx hardhat deploy --network <network_name> --tags ERC721

# Deploy only ERC1155 contracts
npx hardhat deploy --network <network_name> --tags ERC1155

# Deploy specific contract types
npx hardhat deploy --network <network_name> --tags <contract_tag>
```

### Network-Specific Examples

```shell
# Deploy to Ethereum mainnet
npx hardhat deploy --network mainnet --tags all

# Deploy to Polygon
npx hardhat deploy --network polygon_mainnet --tags all

# Deploy to Base
npx hardhat deploy --network base --tags all

# Deploy to testnets
npx hardhat deploy --network sepolia --tags all
npx hardhat deploy --network base_sepolia --tags all
npx hardhat deploy --network polygon_amoy_testnet --tags all
```

### ZK-Sync Deployment

For ZK-Sync compatible chains, use the special configuration:

```shell
# Deploy to Abstract (ZK-Sync compatible)
npx hardhat deploy --tags all-zk --network abstract --config zk.hardhat.config.ts --no-compile

# Deploy to ZKcandy
npx hardhat deploy --tags all-zk --network zkcandy --config zk.hardhat.config.ts --no-compile

# Deploy to ZK-Sync Era
npx hardhat deploy --tags all-zk --network zksync --config zk.hardhat.config.ts --no-compile
```

## Contract Verification

Different chains use different verification methods:

### For Etherscan-compatible chains (Ethereum, BSC, Polygon, etc.):

```shell
npx hardhat --network <network_name> etherscan-verify [--api-key <etherscan-apikey>] [--api-url <url>]
```

Examples:
```shell
# Verify on Ethereum
npx hardhat --network mainnet etherscan-verify --api-key $ETHERSCAN_API_KEY

# Verify on Polygon
npx hardhat --network polygon_mainnet etherscan-verify --api-key $POLYGONSCAN_API_KEY

# Verify on Base
npx hardhat --network base etherscan-verify --api-key $BASESCAN_API_KEY
```

### For Sourcify-compatible chains (Telos, etc.):

```shell
npx hardhat --network <network_name> sourcify
```

### Verification Support by Chain:

**Etherscan API Support:**
- Ethereum (Mainnet & testnets)
- Polygon (Mainnet & testnets)
- Base (Mainnet & testnets)
- Arbitrum (Mainnet & testnets)
- Optimism (Mainnet & testnets)
- BSC (Binance Smart Chain)
- Avalanche
- And other chains using Etherscan-compatible explorers

**Sourcify Support:**
- Telos
- Viction
- Other chains that don't support Etherscan API

## Supported Networks

The token deployment supports 50+ networks including:

**Major Mainnets:**
- Ethereum (`mainnet`)
- Polygon (`polygon_mainnet`)
- Arbitrum (`arbitrum`)
- Base (`base`)
- Optimism (`optimism`)
- BSC (`bsc`)

**Gaming & L2 Networks:**
- Arena-Z (`arenaz`)
- Abstract (`abstract`)
- ZKcandy (`zkcandy`)
- Palm (`palm`)
- Immutable (`immutable`)
- Ronin (`ronin`)

**Enterprise & Specialized:**
- Hedera (`hedera`)
- Telos (`telos`)
- Viction (`viction`)
- Oasis (`oasis`)

**Testnets:**
- Sepolia (`sepolia`)
- Polygon Amoy (`polygon_amoy_testnet`)
- Base Sepolia (`base_sepolia`)
- Arbitrum Sepolia (`arbitrum_sepolia`)
- Arena-Z Testnet (`arenaz_testnet`)
- Abstract Testnet (`abstract_testnet`)

For a complete list of supported networks, see the [networks directory](../hardhat-deploy/networks/).

## Environment Setup

Create a `.env` file with the required configuration:

```bash
# Deployer configuration
PRIVATE_KEY=your_deployer_private_key
HARDWARE_DERIVATION=ledger  # Optional: for hardware wallet
DEPLOYER_ADDRESS=0x...      # Required if using hardware wallet

# API Keys for verification
ETHERSCAN_API_KEY=your_etherscan_api_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key
BASESCAN_API_KEY=your_basescan_api_key
ARBISCAN_API_KEY=your_arbiscan_api_key
OPTIMISTIC_ETHERSCAN_API_KEY=your_optimistic_etherscan_api_key

# Additional network-specific API keys as needed
```

### Generate Deployment Document

After verification, generate a list of deployed contracts and their addresses:

```shell
NETWORK="network-name" bash export-address-to-readme.bash
```

## Testing

To run integration tests of contracts before deployment:

```shell
npx hardhat test
```

For network-specific testing:
```shell
# Test on forked mainnet
npx hardhat test --network hardhat

# Test with specific fork
npx hardhat test --network polygon_fork
```

## Deployment Results

After successful deployment, you can find:

- Contract addresses in `deployments/<network_name>/`
- Verification status in deployment logs
- Network-specific documentation in `networks/<network_name>.md`

### Recent Deployments

**ZK Networks:**
- Abstract ✅ (ZK-compatible)
- ZKcandy ✅ (ZK-compatible)

**Gaming Networks:**
- Arena-Z ✅
- Base ✅

**Traditional Networks:**
- Palm ✅
- Polygon ✅
- Ethereum ✅

## Common Issues & Troubleshooting

### ZK-Sync Deployment Issues
If ZK deployment fails, ensure you're using the correct config:
```shell
# Use the ZK-specific config file
--config zk.hardhat.config.ts
```

### Gas Optimization
For high-gas networks, consider using optimization settings:
```shell
# Deploy with gas optimization
OPTIMIZER_RUNS=20 npx hardhat deploy --network <network_name> --tags all
```

### Network Configuration
Ensure your network configuration includes:
- RPC endpoint
- Chain ID
- Gas price settings
- Block explorer API endpoint (for verification)

## Advanced Usage

### Custom Tags
Deploy specific contract sets using custom tags:
```shell
# Deploy only factory contracts
npx hardhat deploy --network <network_name> --tags factories

# Deploy upgradeable proxies
npx hardhat deploy --network <network_name> --tags proxies
```

### Dry Run
Test deployment without executing:
```shell
npx hardhat deploy --network <network_name> --dry-run
```

# import { OptimizedTransparentUpgradeableProxy } from "hardhat-deploy-immutable-proxy/solc_0.8/proxy/OptimizedTransparentUpgradeableProxy.sol";