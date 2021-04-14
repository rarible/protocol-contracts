let LinearRatioFunction = artifacts.require("LinearRatioFunction.sol");

module.exports = function (deployer, network, from) {
	return deployer.deploy(LinearRatioFunction, { gas: 300000 });
};