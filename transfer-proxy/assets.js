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

const ETH = id("ETH");
const ERC20 = id("ERC20");
const ERC721 = id("ERC721");
const ERC1155 = id("ERC1155");
const ORDER_DATA_V1 = id("V1");
const TO_MAKER = id("TO_MAKER");
const TO_TAKER = id("TO_TAKER");
const PROTOCOL = id("PROTOCOL");
const ROYALTY = id("ROYALTY");
const ORIGIN = id("ORIGIN");
const PAYOUT = id("PAYOUT");
const CRYPTO_PUNKS = id("CRYPTO_PUNKS");

module.exports = { id, ETH, ERC20, ERC721, ERC1155, ORDER_DATA_V1, TO_MAKER, TO_TAKER, PROTOCOL, ROYALTY, ORIGIN, PAYOUT, CRYPTO_PUNKS, enc }