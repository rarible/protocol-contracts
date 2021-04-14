let RariStakeStateV1 = artifacts.require("RariStakeStateV1.sol");
let RariStakeV1 = artifacts.require("RariStakeV1.sol");
let LinearRatioFunction = artifacts.require("LinearRatioFunction.sol");

let settings = {
	"default": {
		rariToken: "0x0000000000000000000000000000000000000000"
	},
	"mainnet": {
		rariToken: "0xfca59cd816ab1ead66534d82bc21e7515ce441cf"
	},
  "ropsten": {
      rariToken: "0x6a55102635f35eb0ca8d1e0c69a8a35e55796c41"
    }
};

function getSettings(network) {
	if (settings[network] !== undefined) {
		return settings[network];
	} else {
		return settings["default"];
	}
}

module.exports = function (deployer, network, from) {
	const { rariToken } = getSettings(network);
	return LinearRatioFunction.deployed().then(f => {
		return RariStakeStateV1.deployed().then(state => {
			return deployer.deploy(RariStakeV1, rariToken, f.address, state.address, { gas: 3000000 }).then(stake => {
				return state.transferOwnership(stake.address, { gas: 50000 });
			});
		});
	});
};