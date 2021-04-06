const EIP712 = require("../EIP712");

const Types = {
	Part: [
		{name: 'account', type: 'address'},
		{name: 'value', type: 'uint96'}
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
	const chainId = Number(await web3.eth.getChainId());
	const data = EIP712.createTypeData({
		name: "Mint1155",
		chainId,
		version: "1",
		verifyingContract
	}, 'Mint1155', { tokenId, supply, tokenURI, creators, royalties }, Types);
	return (await EIP712.signTypedData(web3, account, data)).sig;
}

module.exports = { sign }