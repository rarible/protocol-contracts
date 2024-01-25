const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const RoyaltiesRegistry = artifacts.require("RoyaltiesRegistry");

module.exports = async function (deployer) {
  const royaltiesRegistry = await deployProxy(RoyaltiesRegistry, [], { deployer, initializer: '__RoyaltiesRegistry_init' })
  console.log("deployed royaltiesRegistry at", royaltiesRegistry.address)
};