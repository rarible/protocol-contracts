const { upgradeProxy } = require('@openzeppelin/truffle-upgrades');

const ERC721Rarible = artifacts.require('ERC721Rarible');
const ERC1155Rarible = artifacts.require('ERC1155Rarible');

module.exports = async function (deployer) {
	const erc721 = await ERC721Rarible.deployed();
	await upgradeProxy(erc721.address, ERC721Rarible, { deployer });

	const erc1155 = await ERC1155Rarible.deployed();
	await upgradeProxy(erc1155.address, ERC1155Rarible, { deployer });
};