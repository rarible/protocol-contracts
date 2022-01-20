const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const ExchangeV2 = artifacts.require('ExchangeV2');
const transferManagerAddress = "0x0000000000000000000000000000000000000000";
const protocolFee = 250;

const e2e = {
	communityWallet: "0xfb571F9da71D1aC33E069571bf5c67faDCFf18e4",
	erc20TransferProxy: "0xbf558e78cfde95afbf17a4abe394cb2cc42e6270",
	transferProxy: "0x66611f8d97688a0af08d4337d7846efec6995d58",
	royaltiesRegistry: "0xEd9E4775a5d746fd4b36612fD0B2AfcB05b3147C",
	raribleTransferManager: transferManagerAddress
};

const mainnet = {
	communityWallet: "0x1cf0df2a5a20cd61d68d4489eebbf85b8d39e18a",
	erc20TransferProxy: "0xb8e4526e0da700e9ef1f879af713d691f81507d8",
	transferProxy: "0x4fee7b061c97c9c496b01dbce9cdb10c02f0a0be",
	royaltiesRegistry: "0xC0fd7D55dF0786c09841076E9E5002Ac8B18c494",
	raribleTransferManager: transferManagerAddress
};

const ropsten = {
	communityWallet: "0xe627243104a101ca59a2c629adbcd63a782e837f",
	erc20TransferProxy: "0xa5a51d7b4933185da9c932e5375187f661cb0c69",
	transferProxy: "0xf8e4ecac18b65fd04569ff1f0d561f74effaa206",
	royaltiesRegistry: "0x1331B6a79101fa18218179e78849f1759b846124",
	raribleTransferManager: transferManagerAddress
};

const rinkeby = {
	communityWallet: "0xe627243104a101ca59a2c629adbcd63a782e837f",
	erc20TransferProxy: "0x2fce8435f0455edc702199741411dbcd1b7606ca",
	transferProxy: "0x7d47126a2600e22eab9ed6cf0e515678727779a6",
	royaltiesRegistry: "0xdA8e7D4cF7BA4D5912a68c1e40d3D89828fA6EE8",
	raribleTransferManager: transferManagerAddress
};

let settings = {
	"default": e2e,
	"e2e": e2e,
	"e2e-fork": e2e,
	"ropsten": ropsten,
	"ropsten-fork": ropsten,
	"rinkeby": rinkeby,
	"rinkeby-fork": rinkeby,
	"mainnet": mainnet,
	"mainnet-fork": mainnet
};

function getSettings(network) {
	if (settings[network] !== undefined) {
		return settings[network];
	} else {
		return settings["default"];
	}
}

module.exports = async function (deployer, network) {
	const { communityWallet, erc20TransferProxy, transferProxy, royaltiesRegistry, raribleTransferManager } = getSettings(network);

  await deployProxy(
  	ExchangeV2,
  	[raribleTransferManager, protocolFee],
  	{ deployer, initializer: '__ExchangeV2_init' }
  );
};