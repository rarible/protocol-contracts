# Rari Bridge

LayerZero V2 OFT bridge for RARI token.

## Testnets
- Sepolia (Ethereum test): RariOFTAdapter for existing RARI.
- Base-Sepolia: RariOFT.

(Note: Goerli deprecated; using Sepolia.)

## Deployment
1. Base-Sepolia: npx hardhat deploy --network base-sepolia --tags RariOFT
2. Sepolia: npx hardhat deploy --network sepolia --tags RariOFTAdapter

## Wiring
1. Sepolia: npx hardhat wire --network sepolia --source [RariOFTAdapter addr] --target [RariOFT addr on Base-Sepolia] --target-eid 40245
2. Base-Sepolia: npx hardhat wire --network base-sepolia --source [RariOFT addr] --target [RariOFTAdapter addr on Sepolia] --target-eid 40161

## Mainnet
Similar, but on mainnet (eid 30101) for adapter, Base (eid 30184) for OFT. Update deploy scripts with mainnet RARI (0xfca59cd816ab1ead66534d82bc21e7515ce441cf).

## Usage
- Sepolia: Approve RARI to adapter, call send().
- Base-Sepolia: Call send() on RariOFT.