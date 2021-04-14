let RariStakeStateV1 = artifacts.require("RariStakeStateV1.sol");

module.exports = function (deployer, network, from) {
	return deployer.deploy(RariStakeStateV1, { gas: 1000000 });
};