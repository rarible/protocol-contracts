const Locking = artifacts.require("Locking");

const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const mainnet = {
	token: "0xFca59Cd816aB1eaD66534D82bc21E7515cE441CF",
  startingPointWeek: 309,
  minCliffPeriod: 3,
  minSlopePeriod: 1
}
const rinkeby = {
	token: "0xfad6072626ec68003CEA5064AdA1b42A48352d9B",
  startingPointWeek: 229735,
  minCliffPeriod: 0,
  minSlopePeriod: 0
}
const goerli = {
	token: "0xbe6dEA792E5D557d71a4cDEf7d22d6dccA133891",
  startingPointWeek: 150,
  minCliffPeriod: 0,
  minSlopePeriod: 0
}
const dev = {
	token: "0x55eB2809896aB7414706AaCDde63e3BBb26e0BC6",
  startingPointWeek: 0,
  minCliffPeriod: 0,
  minSlopePeriod: 0
}
const def = {
	token: "0x0000000000000000000000000000000000000000",
  startingPointWeek: 0,
  minCliffPeriod: 0,
  minSlopePeriod: 0
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

  const {token, startingPointWeek, minCliffPeriod, minSlopePeriod} = getSettings(network);

  const locking = await deployProxy(Locking, [token, startingPointWeek, minCliffPeriod, minSlopePeriod], { deployer, initializer: '__Locking_init' })

  console.log(`deployed locking at ${locking.address} for token = ${token} with startingPointWeek = ${startingPointWeek}`)
  console.log(`and minCliffPeriod = ${await locking.minCliffPeriod()}, minSlopePeriod = ${await locking.minSlopePeriod()}`)

};
