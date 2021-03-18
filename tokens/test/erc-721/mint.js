const EIP712 = require("../EIP712");

const Types = {
	Part: [
		{name: 'account', type: 'address'},
		{name: 'value', type: 'uint256'}
	],
	Mint721: [
		{name: 'tokenId', type: 'uint256'},
		{name: 'tokenURI', type: 'string'},
		{name: 'creators', type: 'address[]'},
		{name: 'royalties', type: 'Part[]'}
	]
};

async function sign(account, tokenId, tokenURI, creators, royalties, verifyingContract) {
	const data = EIP712.createTypeData({
		name: "Mint721",
		chainId: 1,
		version: "1",
		verifyingContract
	}, 'Mint721', { tokenId, tokenURI, creators, royalties }, Types);
	return (await EIP712.signTypedData(web3, account, data)).sig;
}

module.exports = { sign }