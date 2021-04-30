const { upgradeProxy } = require('@openzeppelin/truffle-upgrades');

const UpgradeableBeacon = artifacts.require('UpgradeableBeacon');
const ERC721RaribleUser = artifacts.require('ERC721RaribleUser');
const ERC1155RaribleUser = artifacts.require('ERC1155RaribleUser');
const BeaconProxy = artifacts.require('BeaconProxy');

module.exports = async function (deployer) {
	await deployer.deploy(ERC721RaribleUser, { gas: 4000000 });
	const erc721Impl = await ERC721RaribleUser.deployed();
	await deployer.deploy(UpgradeableBeacon, erc721Impl.address);
	const erc721Beacon = await UpgradeableBeacon.deployed();
	console.log("erc721Beacon.address", erc721Beacon.address);

	await deployer.deploy(ERC1155RaribleUser, { gas: 4000000 });
	const erc1155Impl = await ERC1155RaribleUser.deployed();
	await deployer.deploy(UpgradeableBeacon, erc1155Impl.address);
	const erc1155Beacon = await UpgradeableBeacon.deployed();
	console.log("erc1155Beacon.address", erc1155Beacon.address);
};