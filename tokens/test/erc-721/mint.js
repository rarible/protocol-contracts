const EIP712 = require("../EIP712");

const Types = {
	Fee: [
		{name: 'account', type: 'address'},
		{name: 'value', type: 'uint256'}
	],
	Mint721: [
		{name: 'tokenId', type: 'uint256'},
		{name: 'tokenURI', type: 'string'},
		{name: 'creators', type: 'address[]'},
		{name: 'fees', type: 'Fee[]'}
	]
};

async function sign(account, tokenId, tokenURI, creators, fees, verifyingContract) {
	const data = EIP712.createTypeData({
		name: "Mint721",
		chainId: 1,
		version: "1",
		verifyingContract
	}, 'Mint721', { tokenId, tokenURI, creators, fees }, Types);
	return (await EIP712.signTypedData(web3, account, data)).sig;
}

module.exports = { sign }