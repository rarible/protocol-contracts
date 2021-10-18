const { deployProxy } = require('@openzeppelin/truffle-upgrades');
const contract = require("@truffle/contract");
const adminJson = require("@openzeppelin/upgrades-core/artifacts/ProxyAdmin.json")
const ProxyAdmin = contract(adminJson)
ProxyAdmin.setProvider(web3.currentProvider)

const ERC721RaribleMinimal = artifacts.require('ERC721RaribleMinimal');
const ERC721RaribleBeacon = artifacts.require('ERC721RaribleBeacon');
const ERC721RaribleFactoryMinimal = artifacts.require('ERC721RaribleFactoryMinimal');

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

async function getProxyImplementation(contract, network) {
    if (network === "test") {
      network = "unknown-1337"
    }
  
    if (network === "e2e") {
      network = "unknown-17"
    }
  
    let json;
    try {
      json = require(`../.openzeppelin/${network}.json`)
    } catch (e) {
      const tconfig = require('../truffle-config.js')
      const network_id = tconfig.networks[network].network_id;
      json = require(`../.openzeppelin/unknown-${network_id}.json`)
    }
    const c = await ProxyAdmin.at(json.admin.address)
    const deployed = await contract.deployed()
    return c.getProxyImplementation(deployed.address)
  }

module.exports = async function (deployer, network) { 
  const settings = getSettings(network)

  const transferProxy = settings.transferProxy;
  const erc721LazyMintTransferProxy = settings.erc721LazyMintTransferProxy;

  //deploying erc721 proxy
  const erc721Proxy = await deployProxy(ERC721RaribleMinimal, ["Rarible", "RARI", "ipfs:/", ""], { deployer, initializer: '__ERC721Rarible_init' });
  console.log("deployed minimal erc721 at", erc721Proxy.address)
  //setting default approvers
  await erc721Proxy.setDefaultApproval(erc721LazyMintTransferProxy, true, { gas: 100000 });
  await erc721Proxy.setDefaultApproval(transferProxy, true, { gas: 100000 });

  //deploying erc712 factory
  //ERC721RaribleMinimal implementation
  const erc721 = await getProxyImplementation(ERC721RaribleMinimal, network)

  //deploying ERC721RaribleMinimalBeacon
  const beacon721 = await deployer.deploy(ERC721RaribleBeacon, erc721, { gas: 1000000 });

  //deploying factory
  const factory721 = await deployer.deploy(ERC721RaribleFactoryMinimal, beacon721.address, transferProxy, erc721LazyMintTransferProxy, { gas: 1500000 });
  console.log(`deployed minimal factory721 at ${factory721.address}`)
};