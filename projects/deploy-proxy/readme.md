# Deploy Proxy - Factory Contracts

This project contains factory contract deployments for the Rarible Protocol, including proxy factories and third-party integrations.

## Quick Start

```shell
# Install dependencies and compile
yarn install
npx hardhat compile

# Deploy factory contracts
npx hardhat deploy --tags ImmutableCreate2Factory --network <network_name>
```

## Deployment

### Deploy All Factory Contracts

Deploy the main factory contracts:

```shell
# Deploy ImmutableCreate2Factory
npx hardhat deploy --tags ImmutableCreate2Factory --network <network_name>

# Deploy test contracts (for testing)
npx hardhat deploy --tags TestDeployContract --network <network_name>
```

### Network-Specific Examples

```shell
# Deploy to Ethereum Sepolia testnet (default)
npx hardhat deploy --tags ImmutableCreate2Factory --network sepolia

# Deploy to Polygon mainnet
npx hardhat deploy --tags ImmutableCreate2Factory --network polygon_mainnet

# Deploy to Base
npx hardhat deploy --tags ImmutableCreate2Factory --network base
```

### ZK-Sync Deployment

For ZK-Sync compatible chains, use the specialized scripts:

```shell
# Deploy 721 factory on ZK-Sync
npx hardhat run --config zk.hardhat.config.ts scripts/zk-deploy-721-factory.ts

# Compile for ZK-Sync
npx hardhat --config zk.hardhat.config.ts compile
```

## Contract Verification

### Ethereum-compatible chains

```shell
# Verify on Sepolia
npx hardhat verify 0x1bf0973f710Ea3EBaA7b34D5F3733c82585f5252 --network sepolia

# Verify with API key
npx hardhat verify <contract_address> --network <network_name> --api-key <api_key>
```

### ZK-Sync chains

```shell
# Verify on ZK-Sync
npx hardhat verify --config zk.hardhat.config.ts <contract_address>
```

## Available Scripts

This project includes several deployment and verification scripts:

```shell
# Build TypeScript types
yarn build

# Deploy factory contract
yarn deploy

# Deploy test contract
yarn deploy-test-contract

# ZK-Sync specific deployments
yarn deploy-zk
yarn verify-zk
```

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
```

## Contract Addresses Documentation

## Factory Contracts

### ThirdWeb Factory
The main factory contract used by ThirdWeb:
```
0x4e59b44847b379578588920cA78FbF26c0B4956C
```

# ThirdWeb Tokens Project

## Introduction
Welcome to the ThirdWeb Tokens Project documentation! This guide provides a readable and structured overview of how to deploy and manage NFT collections without fees using ThirdWeb and custom contract implementations. Whether you're deploying an NFT drop or exploring clone factories, this document will walk you through the process with examples and links to live contracts and transactions.

---

## Overview
This project showcases a fee-less approach to minting and managing NFTs. By leveraging ThirdWeb's infrastructure and custom implementations, you can deploy NFT collections without incurring secondary fees. Key components include clone factories and specialized contract implementations.

---

## Deployment Examples

### 1. Open Edition (OE) Drop No Fee

- **Description**: A custom implementation designed to eliminate fee structures.

### 2. Clone Factory
- **Contract Address**:  
  [0x9A611f52a1b8007B1A20935ba619352C694fAE8F](https://polygonscan.com/address/0x9A611f52a1b8007B1A20935ba619352C694fAE8F)  
- **Usage**: Integrate with ThirdWeb to deploy NFT collections efficiently.

---

## Development

### Getting Started
1. Clone the project repository from its source.  
2. Install the required dependencies.  
3. Refer to the deployment examples above to set up your use case.

### Key Features
- **No Secondary Fees**: Mint and manage NFTs without additional costs.  
- **ThirdWeb Integration**: Seamless compatibility with ThirdWeb tools.  
- **Clone Factory Support**: Efficient deployment of multiple collections.

---

## Contracts 

### Drop OE
- **Contract Address (Implementation)**:  
  [0x7C4d9b685eBf60679c9852FAb4caa97781f79DEF](https://polygonscan.com/address/0x7C4d9b685eBf60679c9852FAb4caa97781f79DEF#code)  
- **Claim Transaction Without Secondary Fee Recipient**:  
  [View on Polygonscan](https://polygonscan.com/tx/0x2db4734ed77c95b21dabe448c8f66548e315e054f62ebd0dff52e98e26342805)  
- **Contract Instance**:  
  [View on Thirdweb](https://thirdweb.com/polygon/0x1a269327fe80061441979e7aa484749473e56b5c)  

### Drop 721 
- **Contract Address**:  
  [0xAe7c9D8BE532DAE56cdaacD9f91D17243CB8a91E](https://polygonscan.com/address/0xAe7c9D8BE532DAE56cdaacD9f91D17243CB8a91E)  
- **Claim Transaction Without Secondary Fee Recipient**:  
  [View on Polygonscan](https://polygonscan.com/tx/0x666eec972a12ca1bac267a38bbdeb99d7f67ccc6d04c07f2bd3d22732417a991)  
- **Contract Instance**:  
  [View on Thirdweb](https://thirdweb.com/polygon/0x715a49C8808C8EddE4Bd084A26c53E796291657b)  

### Drop 1155 
- **Contract Address**:  
  [0xE4c5B2E3E508A7d83486d31541Abf6F4a875F27f](https://polygonscan.com/address/0xE4c5B2E3E508A7d83486d31541Abf6F4a875F27f)  
- **Claim Transaction Without Secondary Fee Recipient**:  
  [View on Polygonscan](https://polygonscan.com/tx/0x6ed244be3475a6e49ae16d1e71c722f8694c94e1498d4ce3dc36ff98a0c44d91)  
- **Contract Instance**:  
  [View on Thirdweb](https://thirdweb.com/polygon/0x7ba2D7F38C0330EE35945DA4219B45F106e6e174)  

---

## Notes
This documentation serves as a comprehensive guide for interacting with the ThirdWeb Tokens Project. Use the provided contract addresses and transaction links for deeper exploration and verification. For additional support, consult the official ThirdWeb documentation or community resources.