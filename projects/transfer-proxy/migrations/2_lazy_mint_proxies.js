const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const ERC721LazyMintTransferProxy = artifacts.require('ERC721LazyMintTransferProxy');
const ERC1155LazyMintTransferProxy = artifacts.require('ERC1155LazyMintTransferProxy');

module.exports = async function (deployer) {
	await deployer.deploy(ERC721LazyMintTransferProxy, { gas: 1500000 });
	const erc721Proxy = await ERC721LazyMintTransferProxy.deployed();
	await erc721Proxy.__OperatorRole_init({ gas: 200000 });

	await deployer.deploy(ERC1155LazyMintTransferProxy, { gas: 1500000 });
	const erc1155Proxy = await ERC1155LazyMintTransferProxy.deployed();
	await erc1155Proxy.__OperatorRole_init({ gas: 200000 });
};