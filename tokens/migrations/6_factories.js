const { upgradeProxy } = require('@openzeppelin/truffle-upgrades');
const contract = require("@truffle/contract");
const adminJson = require("@openzeppelin/upgrades-core/artifacts/ProxyAdmin.json")
const ProxyAdmin = contract(adminJson)
ProxyAdmin.setProvider(web3.currentProvider)

const ERC721Rarible = artifacts.require('ERC721Rarible');
const ERC721RaribleFactory = artifacts.require('ERC721RaribleFactory');
const ERC721RaribleBeacon = artifacts.require('ERC721RaribleBeacon');
const ERC1155Rarible = artifacts.require('ERC1155Rarible');
const ERC1155RaribleBeacon = artifacts.require('ERC1155RaribleBeacon');
const ERC1155RaribleFactory = artifacts.require('ERC1155RaribleFactory');

const rinkeby = {
	erc721LazyMintTransferProxy: "0x75fDbe19C2dc673384dDc14C9F453dB86F5f32E8",
	erc1155LazyMintTransferProxy: "0x0cF0AAb68432a3710ECbf2f1b112a11cEe31a83C",
	transferProxy: "0x7d47126a2600E22eab9eD6CF0e515678727779A6"
}
const mainnet = {
	erc721LazyMintTransferProxy: "0xbb7829BFdD4b557EB944349b2E2c965446052497",
	erc1155LazyMintTransferProxy: "0x75a8B7c0B22D973E0B46CfBD3e2f6566905AA79f",
	transferProxy: "0x4fee7b061c97c9c496b01dbce9cdb10c02f0a0be"
}
const ropsten = {
	erc721LazyMintTransferProxy: "0x6c49c170c82C40709a32Fb4E827ad3011CD86227",
	erc1155LazyMintTransferProxy: "0x9F7fBc52A53f85e57a5DAde35dFa14797A4dA412",
	transferProxy: "0xf8e4ecac18b65fd04569ff1f0d561f74effaa206"
}
const e2e = {
	erc721LazyMintTransferProxy: "0xe853B9994304264ff418b818A8D23FD39e8DABe6",
	erc1155LazyMintTransferProxy: "0x6E605A7d1FD15e9087f0756ab57E0ED99735a7a7",
	transferProxy: "0x66611f8d97688a0af08d4337d7846efec6995d58"
}
const def = {
	erc721LazyMintTransferProxy: "0x0000000000000000000000000000000000000000",
	erc1155LazyMintTransferProxy: "0x0000000000000000000000000000000000000000",
	transferProxy: "0x0000000000000000000000000000000000000000"
}

let settings = {
	"default": def,
	"rinkeby": rinkeby,
	"rinkeby-fork": rinkeby,
	"ropsten": ropsten,
	"ropsten-fork": ropsten,
	"mainnet": mainnet,
	"mainnet-fork": mainnet,
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

async function getProxyImplementation(contract, network) {
	if (network === "e2e") {
		network = "unknown-17"
	}
  if (network === "test") {
		network = "unknown-1337"
	}
	const json = require(`../.openzeppelin/${network}.json`)
	const c = await ProxyAdmin.at(json.admin.address)
	const deployed = await contract.deployed()
	return c.getProxyImplementation(deployed.address)
}

module.exports = async function (deployer, network) {
	const settings = getSettings(network)

  const impl721 = await getProxyImplementation(ERC721Rarible, network)
	console.log("impl721 is", impl721)	
	const beacon721 = await ERC721RaribleBeacon.deployed().catch(() => deployer.deploy(ERC721RaribleBeacon, impl721, { gas: 500000 }));
	const factory721 = await ERC721RaribleFactory.deployed().catch(() => deployer.deploy(ERC721RaribleFactory, beacon721.address, settings.transferProxy, settings.erc721LazyMintTransferProxy, {gas: 1500000}));
	console.log("721 factory", factory721.address)

  const impl1155 = await getProxyImplementation(ERC1155Rarible, network)
	console.log("impl1155 is", impl1155)	
	const beacon1155 = await ERC1155RaribleBeacon.deployed().catch(() => deployer.deploy(ERC1155RaribleBeacon, impl1155, { gas: 500000 }));
	const factory1155 = await ERC1155RaribleFactory.deployed().catch(() => deployer.deploy(ERC1155RaribleFactory, beacon1155.address, settings.transferProxy, settings.erc1155LazyMintTransferProxy, {gas: 1500000}));
	console.log("1155 factory", factory1155.address)
};