#### Features

This library contains struct `Order` with some functions for this struct:
- hash: calculates hash according to EIP-712 rules. you can find type definitions
- hashKey: calculates key for Order used to record fill of the order (orders with the same key considered as an update)
- validate: validates main order parameters, checks if `Order` can be processed
- calculateRemaining: calculates remaining part of the `Order` (if it's partially filled)

`Order` fields:
- `address` maker
- `Asset` leftAsset (see [LibAsset](../../asset/contracts/LibAsset.md))
- `address` taker (can be zero address)
- `Asset` rightAsset (see [LibAsset](../../asset/contracts/LibAsset.md))
- `uint` salt - random number to distinguish different maker's Orders
- `uint` start - Order can't be matched before this date (optional)
- `uint` end - Order can't be matched after this date (optional)
- `bytes4` dataType - type of data, usually hash of some string, e.g.: "v1", "v2" (see more [here](./LibOrderData.md))
- `bytes` data - generic data, can be anything, extendable part of the order (see more [here](./LibOrderData.md))

#### Types for EIP-712 signature:
```javascript
const Types = {
	AssetType: [
		{name: 'assetClass', type: 'bytes4'},
		{name: 'data', type: 'bytes'}
	],
	Asset: [
		{name: 'assetType', type: 'AssetType'},
		{name: 'value', type: 'uint256'}
	],
	Order: [
		{name: 'maker', type: 'address'},
		{name: 'makeAsset', type: 'Asset'},
		{name: 'taker', type: 'address'},
		{name: 'takeAsset', type: 'Asset'},
		{name: 'salt', type: 'uint256'},
		{name: 'start', type: 'uint256'},
		{name: 'end', type: 'uint256'},
		{name: 'dataType', type: 'bytes4'},
		{name: 'data', type: 'bytes'},
	]
};
```