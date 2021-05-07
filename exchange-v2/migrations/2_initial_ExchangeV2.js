const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const ExchangeV2 = artifacts.require('ExchangeV2');

const e2e = {
	communityWallet: "0xfb571F9da71D1aC33E069571bf5c67faDCFf18e4",
	erc20TransferProxy: "0xbf558e78cfde95afbf17a4abe394cb2cc42e6270",
	transferProxy: "0x66611f8d97688a0af08d4337d7846efec6995d58",
	royaltiesRegistry: "0xEd9E4775a5d746fd4b36612fD0B2AfcB05b3147C"
};

let settings = {
	"default": e2e,
	"e2e": e2e,
	"e2e-fork": e2e
};

function getSettings(network) {
	if (settings[network] !== undefined) {
		return settings[network];
	} else {
		return settings["default"];
	}
}

module.exports = async function (deployer, network) {
	const { communityWallet, erc20TransferProxy, transferProxy, royaltiesRegistry } = getSettings(network);

  await deployProxy(
  	ExchangeV2,
  	[transferProxy, erc20TransferProxy, 100, communityWallet, royaltiesRegistry],
  	{ deployer, initializer: '__ExchangeV2_init' }
  );
};