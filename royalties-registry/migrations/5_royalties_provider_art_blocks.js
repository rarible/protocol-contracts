const RoyaltiesRegistry = artifacts.require('RoyaltiesRegistry');
const RoyaltiesProviderArtBlocks = artifacts.require("RoyaltiesProviderArtBlocks");

const ZERO = "0x0000000000000000000000000000000000000000";

const rinkeby = {
    tokens: [],
    artblocksAddress: ""
}
const mainnet = {
    tokens: [
        "0x059edd72cd353df5106d2b9cc5ab83a52287ac3a",
        "0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270"
    ],
    artblocksAddress: "0x6C093Fe8bc59e1e0cAe2Ec10F0B717D3D182056B"
}
const ropsten = {
    tokens: [],
    artblocksAddress: ""
}
const e2e = {
    tokens: [],
    artblocksAddress: ""
}
const def = {
    tokens: [],
    artblocksAddress: ""
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

    await setArtBlocksProvider(deployer, royaltiesRegistry, settings)

};

// sets royalties Provider for v2 legacy royalty
async function setArtBlocksProvider(deployer, royaltiesRegistry, settings){
    if (!settings.tokens) {
        return;
    }
    if (settings.tokens.length == 0) {
        return;
    }

    const artBlocksAddr = (!!settings.artblocksAddress) ? settings.artblocksAddress : ZERO;
    const royaltiesProviderArtBlocks = await RoyaltiesProviderArtBlocks.deployed().catch(
        () => deployer.deploy(RoyaltiesProviderArtBlocks, artBlocksAddr, { gas: 500000 })
    );
    console.log(`set artblocksAddress ${artBlocksAddr} for royaltiesProviderArtBlocks ${royaltiesProviderArtBlocks.address}`)
    
    for (const token of settings.tokens){
        await royaltiesRegistry.setProviderByToken(token, royaltiesProviderArtBlocks.address,{ gas: 100000 });
        console.log(`set royalties royaltiesProviderArtBlocks ${royaltiesProviderArtBlocks.address} for token ${token}`)
    }

}