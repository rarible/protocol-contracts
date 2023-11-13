const EIP712 = require("./EIP712");

const Types = {
	Part: [
		{name: 'account', type: 'address'},
		{name: 'value', type: 'uint96'}
	],
	Mint721: [
		{name: 'tokenId', type: 'uint256'},
		{name: 'tokenURI', type: 'string'},
		{name: 'creators', type: 'Part[]'},
		{name: 'royalties', type: 'Part[]'}
	]
};

async function sign(account, tokenId, tokenURI, creators, royalties, verifyingContract) {
	const chainId = Number(await web3.eth.getChainId());
	const data = EIP712.createTypeData({
		name: "Mint721",
		chainId,
		version: "1",
		verifyingContract
	}, 'Mint721', { tokenId, tokenURI, creators, royalties }, Types);
  let result;
  try {
    result = (await EIP712.signTypedData(web3, account, data)).sig;
  } catch (error) {
    result = (await EIP712.signTypedData_v4(web3, account, data)).sig
  }
	return result;
}

module.exports = { sign }