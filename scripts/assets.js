const { keccak256, keccakFromString, bufferToHex } = require('ethereumjs-util');

// // 1.  Use the new helper that accepts strings
// function id(str) {
//   return bufferToHex(keccakFromString(str)).slice(0, 10);   // 0x + 8 hex chars
// }

/* 2. Or stay with keccak256 but give it a Buffer/Uint8Array */
function id(str) {
  return bufferToHex(keccak256(Buffer.from(str, 'utf8'))).slice(0, 10);
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
const ERC721_LAZY = id("ERC721_LAZY");
const ERC1155 = id("ERC1155");
const ERC1155_LAZY = id("ERC1155_LAZY");
const COLLECTION = id("COLLECTION");
const CRYPTO_PUNKS = id("CRYPTO_PUNKS");
const ORDER_DATA_V1 = id("V1");
const ORDER_DATA_V2 = id("V2");
const ORDER_DATA_V3 = id("V3");
const TO_MAKER = id("TO_MAKER");
const TO_TAKER = id("TO_TAKER");
const PROTOCOL = id("PROTOCOL");
const ROYALTY = id("ROYALTY");
const ORIGIN = id("ORIGIN");
const PAYOUT = id("PAYOUT");
const LOCK = id("LOCK");
const UNLOCK = id("UNLOCK");
const TO_LOCK = id("TO_LOCK");

module.exports = { id, ETH, ERC20, ERC721, ERC721_LAZY, ERC1155, ERC1155_LAZY, ORDER_DATA_V1, ORDER_DATA_V2, ORDER_DATA_V3, TO_MAKER, TO_TAKER, PROTOCOL, ROYALTY, ORIGIN, PAYOUT, CRYPTO_PUNKS, COLLECTION, LOCK, UNLOCK, TO_LOCK, enc }
