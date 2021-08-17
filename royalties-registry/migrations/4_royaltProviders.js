const RoyaltiesRegistry = artifacts.require('RoyaltiesRegistry');
const RoyaltiesProviderV2Legacy = artifacts.require("RoyaltiesProviderV2Legacy");

const rinkeby = {
    v2Legacy: [],
    artBlocks: [],
}
const mainnet = {
    v2Legacy: [

    ],
    artBlocks: [
        "0x059edd72cd353df5106d2b9cc5ab83a52287ac3a",
        "0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270",
    ]
}
const ropsten = {
    v2Legacy: [],
    artBlocks: [],
}
const e2e = {
    v2Legacy: [],
    artBlocks: [],
}
const def = {
    v2Legacy: [],
    artBlocks: [],
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
    const royaltiesRegistry = await RoyaltiesRegistry.deployed();

    await setV2LegacyProvider(deployer, royaltiesRegistry, settings)

};

// sets royaltyProvider for v2 legacy royalty
async function setV2LegacyProvider(deployer, royaltiesRegistry, settings){
    const providerV2Legacy = await RoyaltiesProviderV2Legacy.deployed().catch(() => deployer.deploy(RoyaltiesProviderV2Legacy,{ gas: 500000 }));
    if (!settings.v2Legacy) {
        return;
    }
    for (const token of settings.v2Legacy){
        await royaltiesRegistry.setProviderByToken(token, providerV2Legacy.address,{ gas: 100000 });
        console.log(`set royaltyProviderV2Legacy ${providerV2Legacy.address} for token ${token}`)
    }
}