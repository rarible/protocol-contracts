const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const WyvernProxyRegistry = artifacts.require('WyvernProxyRegistry');
const WyvernTokenTransferProxy = artifacts.require('WyvernTokenTransferProxy');
const WyvernExchangeWithBulkCancellations = artifacts.require('WyvernExchangeWithBulkCancellations');
const MerkleValidator = artifacts.require('MerkleValidator');

module.exports = async function (deployer) {

	await deployer.deploy(WyvernProxyRegistry, { gas: 2500000 });
	const wyvernProxyRegistry = await WyvernProxyRegistry.deployed();
	console.log("Deployed contract wyvernProxyRegistry at:", wyvernProxyRegistry.address);

	await deployer.deploy(WyvernTokenTransferProxy, wyvernProxyRegistry.address, { gas: 1500000 });
	const wyvernTokenTransferProxy = await WyvernTokenTransferProxy.deployed();
	console.log("Deployed contract wyvernTokenTransferProxy at:", wyvernTokenTransferProxy.address);

  /*constructor (ProxyRegistry registryAddress, TokenTransferProxy tokenTransferProxyAddress, ERC20 tokenAddress, address protocolFeeAddress)*/
	await deployer.deploy(WyvernExchangeWithBulkCancellations, wyvernProxyRegistry.address, wyvernTokenTransferProxy.address, ZERO_ADDRESS, ZERO_ADDRESS, { gas: 5500000 });
	const wyvernExchangeWithBulkCancellations = await WyvernExchangeWithBulkCancellations.deployed();
  console.log("Deployed contract wyvernExchangeWithBulkCancellations at:", wyvernExchangeWithBulkCancellations.address);

  await wyvernProxyRegistry.endGrantAuthentication(wyvernExchangeWithBulkCancellations.address);

  await deployer.deploy(MerkleValidator, { gas: 1500000 });
  const merkleValidator = await MerkleValidator.deployed();
	console.log("Deployed contract MerkleValidator at:", merkleValidator.address);
};