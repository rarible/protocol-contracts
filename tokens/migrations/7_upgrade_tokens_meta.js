const { upgradeProxy } = require('@openzeppelin/truffle-upgrades');

const ERC721Rarible = artifacts.require('ERC721Rarible');
const ERC1155Rarible = artifacts.require('ERC1155Rarible');
const ERC721RaribleMeta = artifacts.require('ERC721RaribleMeta');
const ERC1155RaribleMeta = artifacts.require('ERC1155RaribleMeta');

module.exports = async function (deployer) {
  const existing721 = await ERC721Rarible.deployed();
  await upgradeProxy(existing721.address, ERC721RaribleMeta, { deployer });

	const existing1155 = await ERC1155Rarible.deployed();
	await upgradeProxy(existing1155.address, ERC1155RaribleMeta, { deployer });
};