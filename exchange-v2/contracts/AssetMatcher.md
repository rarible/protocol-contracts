#### Features

`matchAssets` function should calculate if Asset types match with each other. 

Simple asset types match if they are equal, for example, ERC-20 token with address `address1` match to ERC-20 token with address `address1`, but doesn't match any ERC-721 token or ERC-20 token with `address2`.

There can be asset types which can't be compared to other asset types directly. For example, imagine Asset type `any Decentraland Land`. This asset type is not equal `Decentraland Land X` (with specific tokenId), but new `IAssetMatcher` (see [here](./IAssetMatcher.sol)) can be registered in this contract. 

New registered `IAssetMatcher` will be responsible for matching `any Decentraland Land` with `Decentraland Land X`.

Assets match if 
- it's a simple asset and it equals asset from the other side
- registered IAssetMatcher returns match
- otherwise assets match if asset classes match and their data matches (we calculate hash and compare hashes)       