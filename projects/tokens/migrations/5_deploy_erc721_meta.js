const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const ERC721MetaTx = artifacts.require('ERC721RaribleMeta');

const rinkeby = {
	erc721LazyMintTransferProxy: "0x75fDbe19C2dc673384dDc14C9F453dB86F5f32E8",
	transferProxy: "0x7d47126a2600E22eab9eD6CF0e515678727779A6"
}
const mainnet = {
	erc721LazyMintTransferProxy: "0xbb7829BFdD4b557EB944349b2E2c965446052497",
	transferProxy: "0x4fee7b061c97c9c496b01dbce9cdb10c02f0a0be"
}
const ropsten = {
	erc721LazyMintTransferProxy: "0x6c49c170c82C40709a32Fb4E827ad3011CD86227",
	transferProxy: "0xf8e4ecac18b65fd04569ff1f0d561f74effaa206"
}
const e2e = {
	erc721LazyMintTransferProxy: "0xe853B9994304264ff418b818A8D23FD39e8DABe6",
	transferProxy: "0x66611f8d97688a0af08d4337d7846efec6995d58"
}
const def = {
	erc721LazyMintTransferProxy: "0x0000000000000000000000000000000000000000",
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

module.exports = async function (deployer, network) {
  const settings = getSettings(network)

  const transferProxy = settings.transferProxy;
  const erc721LazyMintTransferProxy = settings.erc721LazyMintTransferProxy;

  const erc721WithMetaTx = await deployProxy(ERC721MetaTx, ["Rarible", "RARI", "ipfs:/", "", transferProxy, erc721LazyMintTransferProxy], { deployer, initializer: '__ERC721Rarible_init' });
  console.log(erc721WithMetaTx.address, "erc721 meta")
};

