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

# Scan
- Use the link for scan tokens https://layerzeroscan.com/
- Uxe to get endpoint address https://docs.layerzero.network/v2/deployments/deployed-contracts?stages=testnet&chains=sepolia

# verify 

https://sepolia.basescan.org/address/0xCB7edB78db1c31a2f893Fe202DE57E727DB0c081#code
npx hardhat etherscan-verify-cli \
  --network base_sepolia \
  --contract src/RariOFT.sol:RariOFT \
  --api-url https://api-sepolia.basescan.org/api \
  --api-key API_KEY \
  0xCB7edB78db1c31a2f893Fe202DE57E727DB0c081 \
  0x6EDCE65403992e310A62460808c4b910D972f10f \
  0xe223825497c435BAeaf318F03d33Ec704954028A

https://testnet.berascan.com/address/0xCB7edB78db1c31a2f893Fe202DE57E727DB0c081#code

npx hardhat etherscan-verify-cli \
  --network berachain_testnet \
  --contract src/RariOFT.sol:RariOFT \
  --api-url https://api-testnet.berascan.com/api \
  --api-key API_KEY \
  0xCB7edB78db1c31a2f893Fe202DE57E727DB0c081 \
  0x6C7Ab2202C98C4227C5c46f1417D81144DA716Ff \
  0xe223825497c435BAeaf318F03d33Ec704954028A


npx hardhat etherscan-verify-cli \
  --network sepolia \
  --contract src/RariOFTAdapter.sol:RariOFTAdapter \
  --api-url https://api-sepolia.etherscan.io/api \
  --api-key E7MHB2Z34NBPNBNDW5ZXU18MV6VS4MKRF5 \
  0xcD7f9F32393454Ac805bDC71BcfA98670E13605c \
  0xfAc63865D9cA6f1E70e9C441d4B01255519F7A54 \
  0x6C7Ab2202C98C4227C5c46f1417D81144DA716Ff \
  0xe223825497c435BAeaf318F03d33Ec704954028A

npx hardhat wire --network sepolia --contract 0xcD7f9F32393454Ac805bDC71BcfA98670E13605c  --target 0xCB7edB78db1c31a2f893Fe202DE57E727DB0c081 --target-chain-id 84532
npx hardhat wire --network sepolia --contract 0xcD7f9F32393454Ac805bDC71BcfA98670E13605c  --target 0xCB7edB78db1c31a2f893Fe202DE57E727DB0c081 --target-chain-id 80069

npx hardhat wire --network berachain_testnet --contract 0xCB7edB78db1c31a2f893Fe202DE57E727DB0c081  --target 0xcD7f9F32393454Ac805bDC71BcfA98670E13605c --target-chain-id 11155111
npx hardhat wire --network base_sepolia --contract 0xCB7edB78db1c31a2f893Fe202DE57E727DB0c081  --target 0xcD7f9F32393454Ac805bDC71BcfA98670E13605c --target-chain-id 11155111

npx hardhat wire --network berachain_testnet --contract 0xCB7edB78db1c31a2f893Fe202DE57E727DB0c081  --target 0xCB7edB78db1c31a2f893Fe202DE57E727DB0c081 --target-chain-id 84532
npx hardhat wire --network base_sepolia --contract 0xCB7edB78db1c31a2f893Fe202DE57E727DB0c081  --target 0xCB7edB78db1c31a2f893Fe202DE57E727DB0c081 --target-chain-id 80069

npx hardhat oft:send --network sepolia --source 0xcD7f9F32393454Ac805bDC71BcfA98670E13605c --target-chain-id 84532 --to 0xe223825497c435BAeaf318F03d33Ec704954028A --amount 5

vfadeev@Mac rari-bridge % npx hardhat oft:send --network sepolia --source 0xcD7f9F32393454Ac805bDC71BcfA98670E13605c --target-chain-id 84532 --to 0xe223825497c435BAeaf318F03d33Ec704954028A --amount 5
[sepolia] Approving 0xcD7f9F32393454Ac805bDC71BcfA98670E13605c to spend 5000000000000000000 of 0xfAc63865D9cA6f1E70e9C441d4B01255519F7A54 ...
approve.tx: 0xca4f0c3a916113454b4d0f9a4a5d4ff1427d33c37904d2a1c8103c0e05327d8f
✅ Approved.
Quoted fee: { nativeFee: '7335986817076', lzTokenFee: '0' }
[sepolia] Sending 5 (decimals=18) to 0xe223825497c435BAeaf318F03d33Ec704954028A (eid=40245) ...
send.tx: 0x30b7415f9f3abb7cf36c6ce294b0b4188a2d8a7e199ee6faeefb5b204a059909
✅ Sent.

https://testnet.layerzeroscan.com/tx/0x30b7415f9f3abb7cf36c6ce294b0b4188a2d8a7e199ee6faeefb5b204a059909

RariOFTAdapter deployed to: 0xFBaAE7fC0De990276Bc7EFc51741921C847f5857
RariOFT deployed to: 0x57824A1ecB34DE2f9A32e945911067fd433000F3

npx hardhat wire --network mainnet --contract 0xFBaAE7fC0De990276Bc7EFc51741921C847f5857  --target 0x57824A1ecB34DE2f9A32e945911067fd433000F3 --target-chain-id 8453

npx hardhat wire --network base --contract 0x57824A1ecB34DE2f9A32e945911067fd433000F3  --target 0xFBaAE7fC0De990276Bc7EFc51741921C847f5857 --target-chain-id 1

npx hardhat oft:send --network mainnet --source 0xFBaAE7fC0De990276Bc7EFc51741921C847f5857 --target-chain-id 8453 --to 0xe223825497c435BAeaf318F03d33Ec704954028A --amount 3

--to 0xe223825497c435BAeaf318F03d33Ec704954028A --amount 3
[mainnet] Approving 0xFBaAE7fC0De990276Bc7EFc51741921C847f5857 to spend 3000000000000000000 of 0xFca59Cd816aB1eaD66534D82bc21E7515cE441CF ...
approve.tx: 0x6fe74a2cf329b493ba91437d22826c1431b1766eed2ae5bd4988e506993c3483
✅ Approved.
Quoted fee: { nativeFee: '34286067674433', lzTokenFee: '0' }
[mainnet] Sending 3 (decimals=18) to 0xe223825497c435BAeaf318F03d33Ec704954028A (eid=30184) ...
send.tx: 0xdcb325697040175bea40459e775ae7b6160cdea9bc1838c16642703b5c1b168d
✅ Sent.

npx hardhat oft:send --network base --source 0x57824A1ecB34DE2f9A32e945911067fd433000F3 --target-chain-id 1 --to 0xe223825497c435BAeaf318F03d33Ec704954028A --amount 2

npx hardhat rate:set --network base 

npx hardhat rate:set --network base --contract 0x57824A1ecB34DE2f9A32e945911067fd433000F3 --configs '[{"dstEid":30101,"limit":"20000000000000000000000","window":86400}]