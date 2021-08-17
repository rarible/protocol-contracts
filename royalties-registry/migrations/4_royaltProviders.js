const RoyaltiesRegistry = artifacts.require('RoyaltiesRegistry');
const RoyaltiesProviderV2Legacy = artifacts.require("RoyaltiesProviderV2Legacy");

const rinkeby = {
    v2Legacy: ["0x0A093d230ba7845BcA0898851B093B8B19bc1Ae1"],
}
const mainnet = {
    v2Legacy: ["0x0A093d230ba7845BcA0898851B093B8B19bc1Ae1"],
}
const ropsten = {
    v2Legacy: [],
}
const e2e = {
    v2Legacy: [],
}
const def = {
    v2Legacy: [],
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
    		console.log("setting royalty provider for ", token)
        await royaltiesRegistry.setProviderByToken(token, providerV2Legacy.address,{ gas: 100000 });
        console.log(`set royaltyProviderV2Legacy ${providerV2Legacy.address} for token ${token}`)
    }
}