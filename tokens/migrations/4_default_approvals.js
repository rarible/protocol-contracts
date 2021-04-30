const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const ERC721Rarible = artifacts.require('ERC721Rarible');
const ERC1155Rarible = artifacts.require('ERC1155Rarible');

const rinkeby = {
	erc721LazyMintTransferProxy: "0xBA9966a3E4a3FB0397339c26704456114E45dca2",
	erc1155LazyMintTransferProxy: "0xDF55343d8Ae1423cc32224ae6a9f8F243cc1Fa0c"
}
const def = {
	erc721LazyMintTransferProxy: "0x0000000000000000000000000000000000000000",
	erc1155LazyMintTransferProxy: "0x0000000000000000000000000000000000000000"
}
let settings = {
	"default": def,
	"rinkeby": rinkeby,
	"rinkeby-fork": rinkeby
};

function getSettings(network) {
	if (settings[network] !== undefined) {
		return settings[network];
	} else {
		return settings["default"];
	}
}

module.exports = async function (deployer, network) {
	const { erc721LazyMintTransferProxy, erc1155LazyMintTransferProxy } = getSettings(network);
	const erc721 = await ERC721Rarible.deployed();
	const erc1155 = await ERC1155Rarible.deployed();
	await erc721.setDefaultApproval(erc721LazyMintTransferProxy, true, { gas: 100000 });
	await erc1155.setDefaultApproval(erc1155LazyMintTransferProxy, true, { gas: 100000 });
};
