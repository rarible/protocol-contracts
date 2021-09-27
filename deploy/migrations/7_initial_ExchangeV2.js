const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const ExchangeV2 = artifacts.require('ExchangeV2');
const RoyaltiesRegistry = artifacts.require("RoyaltiesRegistry");
const ERC20TransferProxy = artifacts.require('ERC20TransferProxy');
const TransferProxy = artifacts.require('TransferProxy');

const e2e = {
	communityWallet: "0xfb571F9da71D1aC33E069571bf5c67faDCFf18e4",
};

const mainnet = {
	communityWallet: "0x1cf0df2a5a20cd61d68d4489eebbf85b8d39e18a",
};

const ropsten = {
	communityWallet: "0xe627243104a101ca59a2c629adbcd63a782e837f",
};

const rinkeby = {
	communityWallet: "0xe627243104a101ca59a2c629adbcd63a782e837f",
};

const polygon_mumbai = {
	communityWallet: "0x0CA38eAc26A4D0F17F7f323189282e2c0d8259bD",
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
	"mainnet-fork": mainnet,
	"polygon_mumbai": polygon_mumbai
};

function getSettings(network) {
	if (settings[network] !== undefined) {
		return settings[network];
	} else {
		return settings["default"];
	}
}

module.exports = async function (deployer, network) {
	const {communityWallet} = getSettings(network);

	const transferProxy = (await TransferProxy.deployed()).address;
	const erc20TransferProxy = (await ERC20TransferProxy.deployed()).address;
	const royaltiesRegistry = (await RoyaltiesRegistry.deployed()).address;

  	const exchangeV2 = await deployProxy(
		ExchangeV2,
		[transferProxy, erc20TransferProxy, 0, communityWallet, royaltiesRegistry],
		{ deployer, initializer: '__ExchangeV2_init' }
	);
	console.log("deployed exchangeV2 at", exchangeV2.address)
};