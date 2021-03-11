const ethUtil = require('ethereumjs-util');

function id(str) {
	return `0x${ethUtil.keccak256(str).toString("hex").substring(0, 8)}`;
}

function enc(token, tokenId) {
	if (tokenId) {
		return web3.eth.abi.encodeParameters(["address", "uint256"], [token, tokenId]);
	} else {
		return web3.eth.abi.encodeParameter("address", token);
	}
}

function encDataV1(benificiaryAddress, originAddress, originFee) {
		return web3.eth.abi.encodeParameters(["address", "address", "uint256"], [benificiaryAddress, originAddress, originFee]);
}

const ETH = id("ETH");
const ERC20 = id("ERC20");
const ERC721 = id("ERC721");
const ERC1155 = id("ERC1155");
const ORDER_DATA_V1 = id("V1");

module.exports = { id, ETH, ERC20, ERC721, ERC1155, ORDER_DATA_V1, enc, encDataV1 }