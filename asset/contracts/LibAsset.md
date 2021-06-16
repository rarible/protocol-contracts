#### Features

`LibAsset` contains struct `Asset` and `AssetType`.

`Asset` represents any asset on ethereum blockchain. `Asset` has type and value (amount of an asset).

`AssetType` is a type of a specific asset. For example `AssetType` is specific ERC-721 token (key is token + tokenId) or specific ERC-20 token (DAI for example).
It consists of `asset class` and generic data (format of data is different for different asset classes). For example, for asset class `ERC20` data holds address of the token, for ERC-721 data holds smart contract address and tokenId.  

`Asset` fields:
- `AssetType` assetType
- `uint` value

`AssetType` fields:
- `bytes4` assetClass
- `bytes` data

`Asset` is used in the [LibOrder](../../exchange-v2/contracts/LibOrder.md)