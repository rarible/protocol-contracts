const RariMineV3 = artifacts.require("RariMineV3");
const Locking = artifacts.require("Locking");

const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const mainnet = {
    token: "0xFca59Cd816aB1eaD66534D82bc21E7515cE441CF",
    tokenOwner: "0x876E927e97c8517Ea231066a1e78174A8dcAc191",
    claimCliffWeeks: 3,
    claimSlopeWeeks: 1,
    claimFormulaClaim: 0
}
const goerli = {
    token: "0xbe6dEA792E5D557d71a4cDEf7d22d6dccA133891",
    tokenOwner: "0xcb525c5E60EF37F5f7fb57233c7Ee1338eDC4eAD",
    claimCliffWeeks: 3,
    claimSlopeWeeks: 1,
    claimFormulaClaim: 4000
}

const def = {
  token: "0x0000000000000000000000000000000000000000",
  tokenOwner: "0x0000000000000000000000000000000000000000",
  claimCliffWeeks: 3,
  claimSlopeWeeks: 1,
  claimFormulaClaim: 4000
}

let settings = {
    "default": def,
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

    const { token, tokenOwner, claimCliffWeeks, claimSlopeWeeks, claimFormulaClaim } = getSettings(network);

    const locking = (await Locking.deployed()).address;

    const rariMineV3 = await deployProxy(RariMineV3, [token, tokenOwner, locking, claimCliffWeeks, claimSlopeWeeks, claimFormulaClaim], { deployer, initializer: '__RariMineV3_init', gas: 3000000 })

    console.log(`deployed RariMineV3 at ${rariMineV3.address}`)
    console.log(`settings: ${getSettings(network)}`)

};