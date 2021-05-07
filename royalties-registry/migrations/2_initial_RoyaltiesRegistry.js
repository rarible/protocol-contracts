const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const RoyaltiesRegistry = artifacts.require("RoyaltiesRegistry.sol");

module.exports = async function (deployer, network) {
	await deployProxy(RoyaltiesRegistry, [], { deployer, initializer: '__RoyaltiesRegistry_init' })
};