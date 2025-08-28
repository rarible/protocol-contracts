# Rari Bridge

LayerZero V2 OFT bridge for the RARI token.

## Networks
- Sepolia (Ethereum testnet): `RariOFTAdapter` for existing RARI
- Base Sepolia: `RariOFT`

Note: Goerli is deprecated; use Sepolia.

## Deploy
1) Base Sepolia (deploy OFT)

```bash
npx hardhat deploy --network base_sepolia --tags RariOFT
```

2) Sepolia (deploy Adapter)

```bash
npx hardhat deploy --network sepolia --tags RariOFTAdapter
```

## Wire peers (bidirectional)
The `wire` task sets LayerZero peers between contracts. Pass the destination EVM chainId; the task will map it to the LayerZero endpoint ID.

- From Sepolia Adapter -> Base Sepolia OFT (destination chainId 84532)

```bash
npx hardhat wire --network sepolia \
  --contract <RariOFTAdapter_on_Sepolia> \
  --target <RariOFT_on_Base_Sepolia> \
  --target-chain-id 84532
```

- From Base Sepolia OFT -> Sepolia Adapter (destination chainId 11155111)

```bash
npx hardhat wire --network base_sepolia \
  --contract <RariOFT_on_Base_Sepolia> \
  --target <RariOFTAdapter_on_Sepolia> \
  --target-chain-id 11155111
```

## Verify (examples)
Use the custom CLI to verify on Etherscan-compatible explorers. Syntax:

```bash
npx hardhat etherscan-verify-cli \
  --network <network> \
  --contract <fullyQualifiedName> \
  --api-url <explorerApiUrl> \
  --api-key <API_KEY> \
  <contractAddress> <constructorArg1> <constructorArg2> ...
```

- Base Sepolia (RariOFT):

```bash
npx hardhat etherscan-verify-cli \
  --network base_sepolia \
  --contract src/RariOFT.sol:RariOFT \
  --api-url https://api-sepolia.basescan.org/api \
  --api-key <API_KEY> \
  0xCB7edB78db1c31a2f893Fe202DE57E727DB0c081 \
  0x6EDCE65403992e310A62460808c4b910D972f10f \
  0xe223825497c435BAeaf318F03d33Ec704954028A
```

- Berachain testnet (RariOFT example):

```bash
npx hardhat etherscan-verify-cli \
  --network berachain_testnet \
  --contract src/RariOFT.sol:RariOFT \
  --api-url https://api-testnet.berascan.com/api \
  --api-key <API_KEY> \
  0xCB7edB78db1c31a2f893Fe202DE57E727DB0c081 \
  0x6C7Ab2202C98C4227C5c46f1417D81144DA716Ff \
  0xe223825497c435BAeaf318F03d33Ec704954028A
```

- Sepolia (RariOFTAdapter):

```bash
npx hardhat etherscan-verify-cli \
  --network sepolia \
  --contract src/RariOFTAdapter.sol:RariOFTAdapter \
  --api-url https://api-sepolia.etherscan.io/api \
  --api-key <API_KEY> \
  0xcD7f9F32393454Ac805bDC71BcfA98670E13605c \
  0xfAc63865D9cA6f1E70e9C441d4B01255519F7A54 \
  0x6C7Ab2202C98C4227C5c46f1417D81144DA716Ff \
  0xe223825497c435BAeaf318F03d33Ec704954028A
```

## Transfer tokens (examples)
Task automatically builds LayerZero options, detects decimals, quotes fees, approves underlying ERC20 when using Adapter, and calls `send()`.

Syntax:

```bash
npx hardhat oft:send \
  --network <sourceNetwork> \
  --source <OFT_or_Adapter_address> \
  --target-chain-id <destinationEvmChainId> \
  --to <recipientEvmAddress> \
  --amount <wholeTokens>
```

- Sepolia (Adapter) -> Base Sepolia (OFT):

```bash
npx hardhat oft:send \
  --network sepolia \
  --source 0xcD7f9F32393454Ac805bDC71BcfA98670E13605c \
  --target-chain-id 84532 \
  --to 0xe223825497c435BAeaf318F03d33Ec704954028A \
  --amount 5
```

Expected log excerpt:

```text
[sepolia] Approving 0xcD7f9F3239... to spend 5000000000000000000 of 0xfAc63865D9cA6f1E70e9C441d4B01255519F7A54 ...
Quoted fee: { nativeFee: '...', lzTokenFee: '0' }
[sepolia] Sending 5 (decimals=18) to 0xe2238... (eid=40245) ...
send.tx: 0x...
✅ Sent.
```

- Mainnet (Adapter) -> Base (OFT):

```bash
npx hardhat wire --network mainnet \
  --contract 0xb07F5467a257c6A13A039E3cF21D5b1f225e1afD \
  --target 0xC61f9663E05fccd84d4D6c56A373093437ECB899 \
  --target-chain-id 8453

npx hardhat wire --network base \
  --contract 0xC61f9663E05fccd84d4D6c56A373093437ECB899 \
  --target 0xb07F5467a257c6A13A039E3cF21D5b1f225e1afD \
  --target-chain-id 1

npx hardhat oft:send \
  --network mainnet \
  --source 0xb07F5467a257c6A13A039E3cF21D5b1f225e1afD \
  --target-chain-id 8453 \
  --to 0xe223825497c435BAeaf318F03d33Ec704954028A \
  --amount 100
```

- Base -> Mainnet:

```bash
npx hardhat oft:send \
  --network base \
  --source 0xC61f9663E05fccd84d4D6c56A373093437ECB899 \
  --target-chain-id 1 \
  --to 0xe223825497c435BAeaf318F03d33Ec704954028A \
  --amount 1.1
```

## Rate limits (optional)
Set LayerZero RateLimiter configs on OFT or Adapter:

```bash
npx hardhat rate:set \
  --network base \
  --contract 0xC61f9663E05fccd84d4D6c56A373093437ECB899 \
  --configs '[{"dstEid":30101,"limit":"20000000000000000000000","window":86400}]'
```

## Scans and endpoints
- LayerZero Scan: `https://layerzeroscan.com/` (or `https://testnet.layerzeroscan.com/`)
- Endpoint deployments: `https://docs.layerzero.network/v2/deployments/deployed-contracts`

## Mainnet notes
- Adapter on Ethereum (eid 30101), OFT on Base (eid 30184)
- Update deploy scripts with mainnet RARI `0xfca59cd816ab1ead66534d82bc21e7515ce441cf`

## Known deployments (examples)
- RariOFTAdapter: `0xb07F5467a257c6A13A039E3cF21D5b1f225e1afD`
- RariOFT: `0xC61f9663E05fccd84d4D6c56A373093437ECB899`