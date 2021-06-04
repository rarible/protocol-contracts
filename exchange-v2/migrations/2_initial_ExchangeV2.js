const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const ExchangeV2 = artifacts.require('ExchangeV2');

const e2e = {
	communityWallet: "0xfb571F9da71D1aC33E069571bf5c67faDCFf18e4",
	erc20TransferProxy: "0xbf558e78cfde95afbf17a4abe394cb2cc42e6270",
	transferProxy: "0x66611f8d97688a0af08d4337d7846efec6995d58",
	royaltiesRegistry: "0xEd9E4775a5d746fd4b36612fD0B2AfcB05b3147C"
};

const ropsten = {
	communityWallet: "0xe627243104a101ca59a2c629adbcd63a782e837f",
	erc20TransferProxy: "0xa5a51d7b4933185da9c932e5375187f661cb0c69",
	transferProxy: "0xf8e4ecac18b65fd04569ff1f0d561f74effaa206",
	royaltiesRegistry: "0x1331B6a79101fa18218179e78849f1759b846124"
};

let settings = {
	"default": e2e,
	"e2e": e2e,
	"e2e-fork": e2e,
	"ropsten": ropsten,
	"ropsten-fork": ropsten
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
  	[transferProxy, erc20TransferProxy, 0, communityWallet, royaltiesRegistry],
  	{ deployer, initializer: '__ExchangeV2_init' }
  );
};