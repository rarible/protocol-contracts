const EIP712 = require("../EIP712");

const Types = {
	Part: [
		{name: 'account', type: 'address'},
		{name: 'value', type: 'uint256'}
	],
	Mint1155: [
		{name: 'tokenId', type: 'uint256'},
		{name: 'supply', type: 'uint256'},
		{name: 'tokenURI', type: 'string'},
		{name: 'creators', type: 'address[]'},
		{name: 'royalties', type: 'Part[]'}
	]
};

async function sign(account, tokenId, tokenURI, supply, creators, royalties, verifyingContract) {
	const data = EIP712.createTypeData({
		name: "Mint1155",
		chainId: 1,
		version: "1",
		verifyingContract
	}, 'Mint1155', { tokenId, supply, tokenURI, creators, royalties }, Types);
	return (await EIP712.signTypedData(web3, account, data)).sig;
}

module.exports = { sign }