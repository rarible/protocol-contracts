const EIP712 = require("./EIP712");

function AssetType(tp, data) {
	return { tp, data }
}

function Asset(assetType, assetData, amount) {
	return { assetType: AssetType(assetType, assetData), amount };
}

function Order(maker, makeAsset, taker, takeAsset, salt, start, end, dataType, data) {
	return { maker, makeAsset, taker, takeAsset, salt, start, end, dataType, data };
}

const Types = {
	AssetType: [
		{name: 'tp', type: 'bytes4'},
		{name: 'data', type: 'bytes'}
	],
	Asset: [
		{name: 'assetType', type: 'AssetType'},
		{name: 'amount', type: 'uint256'}
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

async function sign(order, account, verifyingContract) {
	const data = EIP712.createTypeData({
		name: "Exchange",
		version: "2",
		chainId: 1,
		verifyingContract
	}, 'Order', order, Types);
	return (await EIP712.signTypedData(web3, account, data)).sig;
}

module.exports = { AssetType, Asset, Order, sign }