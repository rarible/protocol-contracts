# Hardhat Deploy - Core Protocol

This project contains the core Rarible Protocol contract deployments, including Exchange V2, Royalties, Transfer Managers, and related infrastructure contracts.

Network config must be created in [config folder](./utils/config/) for deployment.

## Quick Start

```shell
# Install dependencies and compile
yarn install
npx hardhat compile

# Deploy all core protocol contracts
npx hardhat deploy --network <network_name> --tags all
```

## Deployment

### Deploy All Core Contracts

For a fresh deployment of the entire core protocol suite on a new chain, use:

```shell
npx hardhat deploy --network <network_name> --tags all
```

This deploys:
- Exchange V2 contracts
- Royalties Registry
- Transfer Proxy and Transfer Manager
- Upgrade Executor
- Supporting infrastructure

### Deploy Specific Contract Groups

For targeted deployments:

```shell
# Deploy only Exchange contracts
npx hardhat deploy --network <network_name> --tags exchange

# Deploy only Royalties contracts
npx hardhat deploy --network <network_name> --tags royalties

# Deploy only Transfer contracts
npx hardhat deploy --network <network_name> --tags transfers

# Deploy proxy contracts
npx hardhat deploy --network <network_name> --tags proxies
```

### Network-Specific Examples

```shell
# Deploy to Ethereum mainnet
npx hardhat deploy --network mainnet --tags all

# Deploy to Polygon
npx hardhat deploy --network polygon_mainnet --tags all

# Deploy to Base
npx hardhat deploy --network base --tags all

# Deploy to L2 networks
npx hardhat deploy --network arbitrum --tags all
npx hardhat deploy --network optimism --tags all

# Deploy to testnets
npx hardhat deploy --network sepolia --tags all
npx hardhat deploy --network polygon_amoy_testnet --tags all
```

### ZK-Sync Deployment

For ZK-Sync compatible chains, use the special configuration:

```shell
# Deploy to Abstract (ZK-Sync compatible)
npx hardhat deploy --tags all-zk --network abstract --config zk.hardhat.config.ts --no-compile

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

# Verify on Arbitrum
npx hardhat --network arbitrum etherscan-verify --api-key $ARBISCAN_API_KEY
```

### For Sourcify-compatible chains (Telos, etc.):

```shell
npx hardhat --network <network_name> sourcify
```

Examples:
```shell
# Verify on Telos
npx hardhat --network telos sourcify

# Verify on Viction
npx hardhat --network viction sourcify
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

The core protocol deployment supports 50+ networks. See the complete list in the [networks directory](./networks/).

**Major Mainnets:**
- Ethereum (`mainnet`)
- Polygon (`polygon_mainnet`) 
- Arbitrum (`arbitrum`)
- Base (`base`)
- Optimism (`optimism`)
- BSC (`bsc`)

**Gaming & Specialized Networks:**
- Arena-Z (`arenaz`)
- Abstract (`abstract`)
- ZKcandy (`zkcandy`)
- Palm (`palm`)
- Hedera (`hedera`)
- Telos (`telos`)

**Testnets:**
- Sepolia (`sepolia`)
- Polygon Amoy (`polygon_amoy_testnet`)
- Base Sepolia (`base_sepolia`)
- Arbitrum Sepolia (`arbitrum_sepolia`)

## Environment Setup

Create a `.env` file in the project root with the required configuration:

```bash
# Deployer configuration
PRIVATE_KEY=your_deployer_private_key
HARDWARE_DERIVATION=ledger  # Optional: for hardware wallet
DEPLOYER_ADDRESS=0x...      # Required if using hardware wallet

# API Keys for contract verification
ETHERSCAN_API_KEY=your_etherscan_api_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key
BASESCAN_API_KEY=your_basescan_api_key
ARBISCAN_API_KEY=your_arbiscan_api_key
OPTIMISTIC_ETHERSCAN_API_KEY=your_optimistic_etherscan_api_key
BSCSCAN_API_KEY=your_bscscan_api_key

# Network-specific RPC URLs (if using custom endpoints)
ETHEREUM_RPC_URL=https://eth-mainnet.alchemyapi.io/v2/your-key
POLYGON_RPC_URL=https://polygon-mainnet.infura.io/v3/your-key
```

### Generate Deployment Document

After verification, generate a comprehensive list of deployed contracts and their addresses:

```shell
NETWORK="network-name" bash export-address-to-readme.bash
```

This creates detailed documentation for each network deployment including:
- Contract addresses
- Transaction hashes
- Verification status
- Network-specific configuration

## Testing

Run comprehensive tests before deployment:

```shell
# Run all tests
npx hardhat test

# Run specific test suites
npx hardhat test test/exchange/
npx hardhat test test/royalties/
npx hardhat test test/transfers/

# Run tests with gas reporting
REPORT_GAS=true npx hardhat test

# Test on forked networks
npx hardhat test --network hardhat_fork
```

## Deployment Architecture

The core protocol consists of several interconnected components:

### Exchange V2
- **ExchangeV2**: Main exchange contract for trading
- **AssetMatchers**: Asset matching logic
- **TransferExecutors**: Transfer execution logic
- **OrderValidators**: Order validation logic

### Royalties System
- **RoyaltiesRegistry**: Global royalties registry
- **LibRoyaltiesV2**: Royalties calculation library
- **RoyaltiesV2Impl**: Implementation contracts

### Transfer System  
- **TransferProxy**: Proxy for token transfers
- **ERC20TransferProxy**: ERC20 specific transfers
- **TransferManager**: Manages transfer execution

### Infrastructure
- **UpgradeExecutor**: Manages contract upgrades
- **ProxyAdmin**: Administers proxy contracts
- **ImmutableCreate2Factory**: Deterministic deployments

## Deployment Results

After successful deployment, you can find:

- **Contract addresses**: `deployments/<network_name>/`
- **ABI files**: `deployments/<network_name>/<contract>.json`
- **Network documentation**: `networks/<network_name>.md`
- **Verification status**: In deployment logs

### Example Network Documentation

Each successful deployment generates documentation like this:

```markdown
# Network: Ethereum Mainnet

## Exchange V2
- **ExchangeV2**: 0x9757F2d2b135150BBeb65308D4a91804107cd8D6
- **TransferProxy**: 0x4feE7B061C97C9c496b01DbcE9CDb10c02f0a0Be

## Royalties
- **RoyaltiesRegistry**: 0xaD9fd7cB4fC7A0fBCE08d64068f60CbDE22Ed8Ce

## Transfer Manager
- **TransferManager**: 0xed5AF388653567Af2F388E6224dC7C4b3241C544
```

## Common Issues & Troubleshooting

### Gas Issues
For high-gas networks, optimize deployment:
```shell
# Deploy with custom gas settings
GAS_PRICE=50000000000 npx hardhat deploy --network mainnet --tags all

# Use gas estimation
npx hardhat deploy --network mainnet --tags all --estimate-gas
```

### ZK-Sync Specific Issues
```shell
# Ensure correct config file usage
npx hardhat deploy --config zk.hardhat.config.ts --network abstract --tags all-zk

# Check ZK compiler version compatibility
npx hardhat compile --config zk.hardhat.config.ts
```

### Proxy Deployment Issues
```shell
# Deploy proxies first
npx hardhat deploy --network <network_name> --tags proxies

# Then deploy implementations
npx hardhat deploy --network <network_name> --tags implementations
```

## Advanced Usage

### Staged Deployment
Deploy in stages for complex setups:
```shell
# Stage 1: Infrastructure
npx hardhat deploy --network <network_name> --tags infrastructure

# Stage 2: Core contracts
npx hardhat deploy --network <network_name> --tags core

# Stage 3: Exchange system
npx hardhat deploy --network <network_name> --tags exchange

# Stage 4: Configuration
npx hardhat deploy --network <network_name> --tags configuration
```

### Multi-Network Deployment
Deploy to multiple networks in sequence:
```shell
# Deploy script for multiple networks
./scripts/deploy-multi-network.sh mainnet polygon_mainnet arbitrum base
```

### Upgrade Deployment
For upgrading existing deployments:
```shell
# Deploy only new implementations
npx hardhat deploy --network <network_name> --tags upgrades

# Execute upgrades through UpgradeExecutor
npx hardhat run scripts/execute-upgrades.ts --network <network_name>
```