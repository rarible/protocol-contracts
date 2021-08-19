const RoyaltiesRegistry = artifacts.require('RoyaltiesRegistry');
const RoyaltiesProviderArtBlocks = artifacts.require("RoyaltiesProviderArtBlocks");

const ZERO = "0x0000000000000000000000000000000000000000";

const rinkeby = {
    tokens: [
        "0x152eeE3DCc5526efd646E9b45c9a9672BfFcc097"
    ],
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
    await setArtBlocksProvider(deployer, network, royaltiesRegistry, settings)

};

// sets royalties Provider for v2 legacy royalty
async function setArtBlocksProvider(deployer, network, royaltiesRegistry, settings){
    // can't deploy without token address
    if (!settings.tokens || settings.tokens.length == 0) {
        return;
    }

    //can't deploy without artblocksAddress
    if (!settings.artblocksAddress || settings.artblocksAddress == ""){
        console.log(`artblocksAddress not set on network ${network} for tokens :${settings.tokens}`)
        return;
    }

    await RoyaltiesProviderArtBlocks.deployed().catch(
        async () => {
            const contract = await deployer.deploy(RoyaltiesProviderArtBlocks, { gas: 1000000 });
            await contract.__RoyaltiesProviderArtBlocks_init({from: settings.artblocksAddress, gas: 200000})
            console.log(`set artblocksAddress ${settings.artblocksAddress} for royaltiesProviderArtBlocks ${contract.address}`)
            for (const token of settings.tokens){
                await royaltiesRegistry.setProviderByToken(token, contract.address,{ gas: 100000 });
                console.log(`set royalties royaltiesProviderArtBlocks ${contract.address} for token ${token}`)
            }
            return contract;
        }
    );
}