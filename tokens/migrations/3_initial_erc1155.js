const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const ERC1155Rarible = artifacts.require('ERC1155Rarible');

const rinkeby = {
	erc721LazyMintTransferProxy: "0x75fDbe19C2dc673384dDc14C9F453dB86F5f32E8",
	erc1155LazyMintTransferProxy: "0x0cF0AAb68432a3710ECbf2f1b112a11cEe31a83C",
	transferProxy: "0x7d47126a2600E22eab9eD6CF0e515678727779A6"
}
const mainnet = {
	erc1155LazyMintTransferProxy: "0x75a8B7c0B22D973E0B46CfBD3e2f6566905AA79f",
	transferProxy: "0x4fee7b061c97c9c496b01dbce9cdb10c02f0a0be"
}
const ropsten = {
	erc1155LazyMintTransferProxy: "0x9F7fBc52A53f85e57a5DAde35dFa14797A4dA412",
	transferProxy: "0xf8e4ecac18b65fd04569ff1f0d561f74effaa206"
}
const e2e = {
	erc1155LazyMintTransferProxy: "0x6E605A7d1FD15e9087f0756ab57E0ED99735a7a7",
	transferProxy: "0x66611f8d97688a0af08d4337d7846efec6995d58"
}
const def = {
	erc1155LazyMintTransferProxy: "0x0000000000000000000000000000000000000000",
	transferProxy: "0x0000000000000000000000000000000000000000"
}
let settings = {
	"default": def,
	"rinkeby": rinkeby,
	"rinkeby-fork": rinkeby,
	"ropsten": ropsten,
	"ropsten-fork": ropsten,
	"mainnet": mainnet,
	"mainnet-fork": mainnet,
	"e2e": e2e,
	"e2e-fork": e2e
};

function getSettings(network) {
	if (settings[network] !== undefined) {
		return settings[network];
	} else {
		return settings["default"];
	}
}

module.exports = async function (deployer, network) {
  const { erc1155LazyMintTransferProxy, transferProxy } = getSettings(network);

  await deployProxy(ERC1155Rarible, ["Rarible", "RARI", "ipfs:/", "", transferProxy, erc1155LazyMintTransferProxy], { deployer, initializer: '__ERC1155Rarible_init' });
};