const RariMineV3 = artifacts.require("RariMineV3");

const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const mainnet = {
    token: "0xFca59Cd816aB1eaD66534D82bc21E7515cE441CF",
    tokenOwner: "0x876E927e97c8517Ea231066a1e78174A8dcAc191",
    staking: "0x096Bd9a7a2e703670088C05035e23c7a9F428496",
    claimCliffWeeks: 0,
    claimSlopeWeeks: 0,
    claimFormulaClaim: 4000
}
const goerli = {
    token: "0xbe6dEA792E5D557d71a4cDEf7d22d6dccA133891",
    tokenOwner: "0xcb525c5E60EF37F5f7fb57233c7Ee1338eDC4eAD",
    staking: "0x39C9D13e1b17Bf1975aFe892e18B1D5A1482b52D",
    claimCliffWeeks: 3,
    claimSlopeWeeks: 1,
    claimFormulaClaim: 4000
}

let settings = {
    "mainnet": mainnet,
    "goerli": goerli
};

function getSettings(network) {
    if (settings[network] !== undefined) {
        return settings[network];
    } else {
        return settings["default"];
    }
}

module.exports = async function (deployer, network, accounts) {

    const { token, tokenOwner, staking, claimCliffWeeks, claimSlopeWeeks, claimFormulaClaim } = getSettings(network);

    const rariMineV3 = await deployProxy(RariMineV3, [token, tokenOwner, staking, claimCliffWeeks, claimSlopeWeeks, claimFormulaClaim], { deployer, initializer: '__RariMineV3_init', gas: 3000000 })

    console.log(`deployed RariMineV3 at ${rariMineV3.address}`)
    console.log(`settings: ${getSettings(network)}`)

};