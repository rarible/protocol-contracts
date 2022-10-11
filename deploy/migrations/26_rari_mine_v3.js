const RariMineV3 = artifacts.require("RariMineV3");

const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const mainnet = {
    token: "0x0000000000000000000000000000000000000000",
    tokenOwner: "0x0000000000000000000000000000000000000000",
    staking: "0x0000000000000000000000000000000000000000",
    claimCliffWeeks: 0,
    claimSlopeWeeks: 0,
    claimFormulaClaim: 4000
}
const rinkeby = {
    token: "0xfad6072626ec68003CEA5064AdA1b42A48352d9B",
    tokenOwner: "0x0000000000000000000000000000000000000000",
    staking: "0x0000000000000000000000000000000000000000",
    claimCliffWeeks: 0,
    claimSlopeWeeks: 0,
    claimFormulaClaim: 4000
}
const goerli = {
    token: "0xbe6dEA792E5D557d71a4cDEf7d22d6dccA133891",
    tokenOwner: "0xfb571F9da71D1aC33E069571bf5c67faDCFf18e4",
    staking: "0x6D5E228C25730502aF5ACffa2eB34956c33ad7C2",
    claimCliffWeeks: 3,
    claimSlopeWeeks: 1,
    claimFormulaClaim: 4000
}
const dev = {
    token: "0x55eB2809896aB7414706AaCDde63e3BBb26e0BC6",
    tokenOwner: "0x0000000000000000000000000000000000000000",
    staking: "0x0000000000000000000000000000000000000000",
    claimCliffWeeks: 0,
    claimSlopeWeeks: 0,
    claimFormulaClaim: 4000
}
const def = {
    token: "0x0000000000000000000000000000000000000000",
    tokenOwner: "0x0000000000000000000000000000000000000000",
    staking: "0x0000000000000000000000000000000000000000",
    claimCliffWeeks: 0,
    claimSlopeWeeks: 0,
    claimFormulaClaim: 4000
}

let settings = {
    "default": def,
    "rinkeby": rinkeby,
    "mainnet": mainnet,
    "goerli": goerli,
    "dev": dev
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

    const rariMineV3 = await deployProxy(RariMineV3, [token, tokenOwner, staking, claimCliffWeeks, claimSlopeWeeks, claimFormulaClaim], { deployer, initializer: '__RariMineV3_init' })

    console.log(`deployed RariMineV3 at ${rariMineV3.address}`)
    console.log(`settings: ${getSettings(network)}`)

};